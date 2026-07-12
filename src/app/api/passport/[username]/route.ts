import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const { username } = params;

  try {
    // 1. Fetch learner passport
    const { data: passport, error: passportError } = await supabaseAdmin
      .from('learner_passports')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (passportError) {
      return NextResponse.json({ error: 'Failed to retrieve passport: ' + passportError.message }, { status: 500 });
    }

    if (!passport) {
      return NextResponse.json({ error: 'Passport profile not found' }, { status: 404 });
    }

    // 2. Fetch all verified certificates matching the passport owner's email
    const { data: certs, error: certsError } = await supabaseAdmin
      .from('certs')
      .select('*, events:event_id(name, date, template)')
      .eq('fields->>Email', passport.email)
      .eq('status', 'active');

    if (certsError) {
      return NextResponse.json({ error: 'Failed to fetch credentials: ' + certsError.message }, { status: 500 });
    }

    // 3. Compile dynamic skill graph statistics
    const skillCounts: Record<string, number> = {};
    passport.skills?.forEach((skill: string) => {
      skillCounts[skill] = 2; // Base weight for listed skills
    });

    // Extract skills from certificate event names (e.g., 'Web Development Workshop' -> HTML, CSS, JS)
    certs?.forEach((c: any) => {
      const name = (c.events?.name || '').toLowerCase();
      if (name.includes('python')) skillCounts['Python'] = (skillCounts['Python'] || 0) + 3;
      if (name.includes('linux')) skillCounts['Linux'] = (skillCounts['Linux'] || 0) + 3;
      if (name.includes('sql') || name.includes('data')) skillCounts['SQL/Database'] = (skillCounts['SQL/Database'] || 0) + 3;
      if (name.includes('cyber') || name.includes('security')) skillCounts['Security'] = (skillCounts['Security'] || 0) + 3;
      if (name.includes('web') || name.includes('javascript') || name.includes('react') || name.includes('frontend')) {
        skillCounts['Web Development'] = (skillCounts['Web Development'] || 0) + 3;
      }
      if (name.includes('network') || name.includes('cisco')) skillCounts['Networking'] = (skillCounts['Networking'] || 0) + 3;
      if (name.includes('cloud') || name.includes('aws') || name.includes('docker')) skillCounts['Cloud/DevOps'] = (skillCounts['Cloud/DevOps'] || 0) + 3;
    });

    const skillGraph = Object.entries(skillCounts).map(([name, weight]) => ({
      skill: name,
      level: Math.min(weight * 10, 100), // convert to percentage, max 100
    }));

    // 4. Compile dynamic badges & achievements
    const badges = [...(passport.badges || [])];
    const totalCerts = certs?.length || 0;
    
    if (totalCerts >= 1 && !badges.includes('First Certificate')) {
      badges.push('🥉 First Certificate');
    }
    if (totalCerts >= 5 && !badges.includes('Skill Collector')) {
      badges.push('🥈 Skill Collector');
    }
    if (totalCerts >= 10 && !badges.includes('Credential Master')) {
      badges.push('🥇 Credential Master');
    }

    const hasHackathon = certs?.some((c: any) => (c.events?.name || '').toLowerCase().includes('hackathon'));
    if (hasHackathon && !badges.includes('Hackathon Warrior')) {
      badges.push('🏆 Hackathon Warrior');
    }

    const hasSpeaker = certs?.some((c: any) => (c.events?.name || '').toLowerCase().includes('speaker') || (c.events?.name || '').toLowerCase().includes('talk'));
    if (hasSpeaker && !badges.includes('Vocal Speaker')) {
      badges.push('🎖 Speaker/Presenter');
    }

    return NextResponse.json({
      success: true,
      passport: {
        ...passport,
        skills: Object.keys(skillCounts),
        badges,
      },
      credentials: certs || [],
      skillGraph,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const { username } = params;

  try {
    const body = await req.json();
    const { email, fullName, bio, skills } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing required profile fields: email and fullName' }, { status: 400 });
    }

    let sanitizedEmail = '';
    try {
      sanitizedEmail = sanitizeEmail(email);
    } catch {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    // Check if username is already taken by another passport
    const { data: existingUser } = await supabaseAdmin
      .from('learner_passports')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    let result;
    if (existingUser) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('learner_passports')
        .update({
          email: sanitizedEmail,
          full_name: sanitizeText(fullName),
          bio: bio ? sanitizeText(bio) : null,
          skills: skills || [],
        })
        .eq('username', username.toLowerCase())
        .select('*')
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from('learner_passports')
        .insert({
          username: username.toLowerCase(),
          email: sanitizedEmail,
          full_name: sanitizeText(fullName),
          bio: bio ? sanitizeText(bio) : null,
          skills: skills || [],
          badges: ['🥉 Passport Holder'],
        })
        .select('*')
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, passport: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
