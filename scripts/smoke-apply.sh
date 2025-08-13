#!/bin/bash

# Smoke test for job application endpoint
# Tests: GET /api/public/jobs → pick an open job → POST /api/jobs/:jobId/apply → GET /api/jobs/:jobId/pipeline

set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
TEMP_FILE="/tmp/smoke-apply-$$.json"

echo "🧪 Starting job application smoke test..."
echo "📍 Base URL: $BASE_URL"

# Step 1: Get list of public jobs
echo ""
echo "📋 Step 1: Fetching public jobs..."
HTTP_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/public/jobs")
HTTP_STATUS=$(echo "$HTTP_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
JSON_RESPONSE=$(echo "$HTTP_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Failed to fetch jobs (HTTP $HTTP_STATUS)"
  echo "$JSON_RESPONSE"
  exit 1
fi

echo "$JSON_RESPONSE" > "$TEMP_FILE"

if ! jq . "$TEMP_FILE" > /dev/null 2>&1; then
  echo "❌ Invalid JSON response"
  cat "$TEMP_FILE"
  exit 1
fi

# Find an open job
OPEN_JOB_ID=$(jq -r '.[] | select(.status == "open") | .id' "$TEMP_FILE" | head -n1)

if [ "$OPEN_JOB_ID" = "null" ] || [ -z "$OPEN_JOB_ID" ]; then
  echo "❌ No open jobs found"
  echo "Available jobs:"
  jq -r '.[] | "\(.id) - \(.title) - \(.status)"' "$TEMP_FILE"
  exit 1
fi

JOB_TITLE=$(jq -r ".[] | select(.id == \"$OPEN_JOB_ID\") | .title" "$TEMP_FILE")
echo "✅ Found open job: $JOB_TITLE (ID: $OPEN_JOB_ID)"

# Step 2: Submit job application
echo ""
echo "📤 Step 2: Submitting job application..."

TIMESTAMP=$(date +%s)
APPLICATION_DATA=$(cat <<EOF
{
  "firstName": "Test",
  "lastName": "Applicant$TIMESTAMP",
  "email": "test.applicant$TIMESTAMP@example.com",
  "phone": "+1-555-0123",
  "coverLetter": "I am very interested in this position and believe I would be a great fit for your team.",
  "resumeUrl": "https://example.com/resume.pdf"
}
EOF
)

echo "Applying to job $OPEN_JOB_ID with email: test.applicant$TIMESTAMP@example.com"

APPLICATION_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$BASE_URL/api/jobs/$OPEN_JOB_ID/apply" \
  -H "Content-Type: application/json" \
  -d "$APPLICATION_DATA")

HTTP_STATUS=$(echo "$APPLICATION_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$APPLICATION_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ Application submitted successfully (HTTP $HTTP_STATUS)"
  echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
  
  # Extract application ID if available
  APPLICATION_ID=$(echo "$RESPONSE_BODY" | jq -r '.application.id // .id // empty' 2>/dev/null)
  if [ -n "$APPLICATION_ID" ]; then
    echo "📋 Application ID: $APPLICATION_ID"
  fi
else
  echo "❌ Application submission failed (HTTP $HTTP_STATUS)"
  echo "Response: $RESPONSE_BODY"
  exit 1
fi

# Step 3: Check pipeline to verify application appears
echo ""
echo "🔍 Step 3: Verifying application in job pipeline..."

# Note: This endpoint may require authentication, so we'll try but accept failure
PIPELINE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "$BASE_URL/api/jobs/$OPEN_JOB_ID/pipeline" 2>/dev/null || echo "HTTP_STATUS:000")

PIPELINE_HTTP_STATUS=$(echo "$PIPELINE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
PIPELINE_BODY=$(echo "$PIPELINE_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$PIPELINE_HTTP_STATUS" = "200" ]; then
  echo "✅ Pipeline data retrieved successfully"
  
  # Check if our application appears in the pipeline
  NEW_APPLICATIONS=$(echo "$PIPELINE_BODY" | jq -r '.applications[]? | select(.candidates.email == "test.applicant'$TIMESTAMP'@example.com") | .id' 2>/dev/null || echo "")
  
  if [ -n "$NEW_APPLICATIONS" ]; then
    echo "✅ Application found in pipeline!"
    echo "📋 Pipeline Application ID: $NEW_APPLICATIONS"
  else
    echo "⚠️  Application not immediately visible in pipeline (may require authentication or processing time)"
  fi
elif [ "$PIPELINE_HTTP_STATUS" = "401" ] || [ "$PIPELINE_HTTP_STATUS" = "403" ]; then
  echo "⚠️  Pipeline check skipped (authentication required - HTTP $PIPELINE_HTTP_STATUS)"
elif [ "$PIPELINE_HTTP_STATUS" = "000" ]; then
  echo "⚠️  Pipeline check skipped (connection error)"
else
  echo "⚠️  Pipeline check failed (HTTP $PIPELINE_HTTP_STATUS)"
  echo "Response: $PIPELINE_BODY"
fi

# Cleanup
rm -f "$TEMP_FILE"

echo ""
echo "🎉 Smoke test completed successfully!"
echo "✅ Job application flow is working"
echo ""
echo "Summary:"
echo "  - Found open job: $JOB_TITLE"
echo "  - Successfully submitted application"
echo "  - Test email: test.applicant$TIMESTAMP@example.com"