-- Step 2: Create AI Insights tables (run AFTER step 1 is committed)
-- Only run this after step 1 has been successfully executed

-- Table to cache AI insights and reduce OpenAI API calls
CREATE TABLE IF NOT EXISTS ai_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,
  recruitment_metrics JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track AI recommendation history and user actions
CREATE TABLE IF NOT EXISTS ai_recommendations_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recommendation_id VARCHAR(255) NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('optimization', 'risk', 'opportunity', 'action')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  action_items JSONB DEFAULT '[]',
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('helpful', 'not_helpful', 'implemented', 'dismissed')),
  implemented_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track AI insights performance metrics
CREATE TABLE IF NOT EXISTS ai_insights_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  total_insights_generated INTEGER DEFAULT 0,
  recommendations_implemented INTEGER DEFAULT 0,
  recommendations_dismissed INTEGER DEFAULT 0,
  avg_user_rating DECIMAL(2,1),
  api_calls_count INTEGER DEFAULT 0,
  last_generation_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_org_id ON ai_insights_cache(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_cache_expires_at ON ai_insights_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_history_org_id ON ai_recommendations_history(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_history_type ON ai_recommendations_history(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_history_priority ON ai_recommendations_history(priority);
CREATE INDEX IF NOT EXISTS idx_ai_insights_metrics_org_id ON ai_insights_metrics(org_id);

-- Row Level Security (RLS) policies
ALTER TABLE ai_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for ai_insights_cache
CREATE POLICY "Users can view their organization's AI insights cache" ON ai_insights_cache
  FOR SELECT USING (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI insights cache for their organization" ON ai_insights_cache
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "Users can update their organization's AI insights cache" ON ai_insights_cache
  FOR UPDATE USING (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'hiring_manager', 'recruiter')
    )
  );

-- Policies for ai_recommendations_history
CREATE POLICY "Users can view their organization's AI recommendations history" ON ai_recommendations_history
  FOR SELECT USING (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI recommendations history for their organization" ON ai_recommendations_history
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "Users can update their organization's AI recommendations history" ON ai_recommendations_history
  FOR UPDATE USING (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'hiring_manager', 'recruiter')
    )
  );

-- Policies for ai_insights_metrics
CREATE POLICY "Users can view their organization's AI insights metrics" ON ai_insights_metrics
  FOR SELECT USING (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI insights metrics for their organization" ON ai_insights_metrics
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "Users can update their organization's AI insights metrics" ON ai_insights_metrics
  FOR UPDATE USING (
    org_id IN (
      SELECT uo.org_id FROM user_organizations uo 
      WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'hiring_manager', 'recruiter')
    )
  );

-- Function to clean up expired AI insights cache
CREATE OR REPLACE FUNCTION cleanup_expired_ai_insights_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM ai_insights_cache 
  WHERE expires_at < NOW();
END;
$$;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_ai_insights_cache_updated_at 
  BEFORE UPDATE ON ai_insights_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_history_updated_at 
  BEFORE UPDATE ON ai_recommendations_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_metrics_updated_at 
  BEFORE UPDATE ON ai_insights_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ai_insights_cache TO authenticated;
GRANT ALL ON ai_recommendations_history TO authenticated;
GRANT ALL ON ai_insights_metrics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_insights_cache IS 'Caches AI-generated insights to reduce API calls and improve performance';
COMMENT ON TABLE ai_recommendations_history IS 'Tracks history of AI recommendations and user feedback';
COMMENT ON TABLE ai_insights_metrics IS 'Stores performance metrics for AI insights feature';

COMMENT ON COLUMN ai_insights_cache.insights_data IS 'JSON data containing the generated AI insights and recommendations';
COMMENT ON COLUMN ai_insights_cache.recruitment_metrics IS 'JSON data containing the recruitment metrics used to generate insights';
COMMENT ON COLUMN ai_insights_cache.expires_at IS 'Timestamp when this cache entry expires and should be regenerated';

COMMENT ON COLUMN ai_recommendations_history.recommendation_id IS 'Unique identifier for tracking the same recommendation across sessions';
COMMENT ON COLUMN ai_recommendations_history.user_feedback IS 'User feedback on the recommendation (helpful, not_helpful, implemented, dismissed)';
COMMENT ON COLUMN ai_recommendations_history.confidence IS 'AI confidence score for this recommendation (0-100)';

COMMENT ON COLUMN ai_insights_metrics.total_insights_generated IS 'Total number of AI insights generated for this organization';
COMMENT ON COLUMN ai_insights_metrics.recommendations_implemented IS 'Number of recommendations that were marked as implemented';
COMMENT ON COLUMN ai_insights_metrics.avg_user_rating IS 'Average user rating for AI recommendations';