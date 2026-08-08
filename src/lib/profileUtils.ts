export function dbProfileToDisplay(p: any) {
  const dob = p.date_of_birth;
  const age = dob
    ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  return {
    id: p.id,
    dbId: p.id,
    userId: p.user_id,
    user_id: p.user_id, // alias for consistency
    name: p.full_name || "Unknown",
    age,
    location: [p.city_village, p.state].filter(Boolean).join(", ") || "India",
    occupation: p.occupation || "Not specified",
    education: p.education || "Not specified",
    community: p.community || "Banjara",
    gotra: p.gotra || "",
    photo: p.photo_url || "/placeholder.svg",
    height: p.height || "",
    maritalStatus: p.marital_status || "Never Married",
    isPremium: p.is_premium || false,
    isVerified: p.is_verified || false,
    isOnline: p.is_online || false,
    about: p.about,
    income: p.annual_income,
    motherTongue: p.mother_tongue,
    rashi: p.rashi,
    manglik: p.manglik,
  };
}

export function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;
  const fields = [
    "full_name", "date_of_birth", "gender", "photo_url",
    "community", "gotra", "mother_tongue",
    "state", "city_village",
    "education", "occupation", "annual_income", "height", "marital_status",
    "rashi", "nakshatra", "manglik", "birth_time", "birth_place",
    "about",
  ];
  const filled = fields.filter((f) => {
    const val = profile[f];
    return val !== null && val !== undefined && val !== "";
  }).length;
  return Math.round((filled / fields.length) * 100);
}

export function getPostAuthRoute(profile: any | null) {
  if (!profile) return "/register";

  const step = profile.registration_step ?? 1;
  const completion = profile.profile_completion ?? 0;

  // Fully done: step >= 4 or profile is mostly complete
  if (step >= 4 || completion > 80) return "/";

  // Step 1 = brand new user, needs SetupProfile
  if (step < 2) return "/setup-profile";

  // Step 2 = completed SetupProfile (basic details saved). Go home.
  // They can complete more details via EditProfile later.
  if (step >= 2) return "/";

  return "/";
}

