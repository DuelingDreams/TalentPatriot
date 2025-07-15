-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true);

-- Set up RLS policies for the resumes bucket
CREATE POLICY "Allow authenticated users to upload resumes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view resumes" ON storage.objects
  FOR SELECT USING (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated users to update resumes" ON storage.objects
  FOR UPDATE USING (bucket_id = 'resumes' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete resumes" ON storage.objects
  FOR DELETE USING (bucket_id = 'resumes' AND auth.role() = 'authenticated');