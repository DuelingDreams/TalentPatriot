# AI Resume Parsing

TalentPatriot uses OpenAI GPT-4o to automatically extract and structure candidate information from uploaded resumes.

## How It Works

When a candidate uploads a resume (PDF, DOCX, or TXT), the AI automatically extracts:

- **Contact Information**: Name, email, phone, location
- **Work Experience**: Job titles, companies, dates, descriptions
- **Education**: Degrees, schools, graduation years
- **Skills**: Technical and soft skills with proficiency levels
- **Professional Summary**: Auto-generated candidate overview

## Using Resume Parsing

### Automatic Parsing
Resume parsing happens automatically when:
1. A candidate applies through the public careers portal
2. A recruiter uploads a resume via the candidate profile

### Manual Trigger
You can re-parse a resume by:
1. Going to the candidate profile
2. Clicking "Re-parse Resume" in the resume section

## Parsed Data Fields

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Full name | John Smith |
| `email` | Email address | john@email.com |
| `phone` | Phone number | +1-555-0123 |
| `skills` | Array of skills | ["React", "TypeScript"] |
| `skillLevels` | Proficiency ratings | {"React": 5, "TypeScript": 4} |
| `experienceLevel` | Career level | senior |
| `totalYearsExperience` | Years of experience | 8 |
| `education` | Education history | JSON string |
| `summary` | Professional summary | "Experienced developer..." |

## Skill Proficiency Levels

Skills are rated 1-5:
- **1**: Beginner - Basic familiarity
- **2**: Elementary - Can perform simple tasks
- **3**: Intermediate - Can work independently
- **4**: Advanced - Expert-level proficiency
- **5**: Expert - Industry-leading expertise

## Best Practices

1. **Resume Quality**: Better formatted resumes yield more accurate parsing
2. **File Formats**: PDF works best, followed by DOCX
3. **Verification**: Always review parsed data for accuracy
4. **Manual Edits**: You can edit any parsed field in the candidate profile

## API Endpoint

```
POST /api/ai/parse-resume
Content-Type: multipart/form-data

{
  "resume": [file_data],
  "candidateId": "uuid" (optional)
}
```

## Related Features
- [Candidate Profiles](./candidate-profiles.md)
- [Search & Filtering](./search-filtering.md)
