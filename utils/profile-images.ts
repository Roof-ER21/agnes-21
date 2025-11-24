const profileImages: { [key: string]: string } = {
  "Ben Salgado": "/images/ben-salgado.png",
  "Andre M.": "/images/andre-m.png",
  "Miguel Ocampo": "/images/miguel-ocampo.png",
  "Ross Renzi": "/images/ross-renzi.png",
  Navid: "/images/navid.png",
  "Larry H.": "/images/larry-h.png",
  "Michael Swearingen": "/images/michael-swearingen.png",
  Richie: "/images/richie.png",
  Luis: "/images/luis.png",
  "Jason B.": "/images/jason-b.png",
}

export function getProfileImage(name: string): string {
  return profileImages[name] || "/placeholder.svg"
}

export function getInitials(name: string): string {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}
