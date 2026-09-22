import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rwbqfxiqqgdjumtwckjy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YnFmeGlxcWdkanVtdHdja2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTA2NjEsImV4cCI6MjEwNTYyNjY2MX0.bgcFMyUIIiAv2OydZuNWGwdI1XJ-LalaIYXJFtOsSl8'

export const supabase = createClient(supabaseUrl, supabaseKey)