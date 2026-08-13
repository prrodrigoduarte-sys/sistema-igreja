import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knddosboqjeaefqxdmmt.supabase.co';
const supabaseAnonKey = 'sb_publishable_kHGViXsw4za38lhDwJPbwQ_CBWn92dK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);