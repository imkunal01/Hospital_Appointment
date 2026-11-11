export const DOCTOR_PORTRAITS: Record<string, string> = {
  maya: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  noah: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
  sarah: 'https://images.unsplash.com/photo-1594824813589-3286f05f333f?auto=format&fit=crop&w=400&q=80',
  robert: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  elena: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  marcus: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
  james: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
  sophia: 'https://images.unsplash.com/photo-1594824813589-3286f05f333f?auto=format&fit=crop&w=400&q=80',
  david: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  rachel: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  anthony: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
  laura: 'https://images.unsplash.com/photo-1594824813589-3286f05f333f?auto=format&fit=crop&w=400&q=80',
  tariq: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80'
};

export function getDoctorPortrait(doctorName: string = ''): string {
  const normalized = doctorName.toLowerCase();
  for (const [key, url] of Object.entries(DOCTOR_PORTRAITS)) {
    if (normalized.includes(key)) {
      return url;
    }
  }
  // Default expressive medical portrait
  return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80';
}

export function getDoctorExperience(doctorName: string = ''): string {
  let hash = 0;
  for (let i = 0; i < doctorName.length; i++) {
    hash = (hash << 5) - hash + doctorName.charCodeAt(i);
  }
  const years = 6 + (Math.abs(hash) % 15);
  return `${years} years experience`;
}

