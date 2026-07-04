import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../lib/db/src/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const PROVIDERS = [
  {
    name: "Dr. Sarah Al-Khalidi", title: "Clinical Psychologist",
    specialty: "Anxiety & Stress", bio: "Dr. Al-Khalidi brings 14 years of experience treating anxiety disorders, OCD, and panic attacks using CBT and mindfulness. She trained at the University of Jordan and completed her residency at Hamad Medical Corporation.",
    rating: 4.9, reviewCount: 127, yearsExperience: 14,
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 41, languages: ["Arabic", "English"], acceptsInsurance: true, nextAvailable: "Tomorrow",
  },
  {
    name: "Dr. James Okafor", title: "Psychiatrist, MD",
    specialty: "Depression", bio: "Dr. Okafor is a board-certified psychiatrist with expertise in treatment-resistant depression, bipolar disorder, and medication management. He trained at Johns Hopkins and has published research in Nature Mental Health.",
    rating: 4.8, reviewCount: 203, yearsExperience: 18,
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 180, languages: ["English", "Yoruba"], acceptsInsurance: true, nextAvailable: "Today, 3:00 PM",
  },
  {
    name: "Dr. Fatima Al-Rashidi", title: "Therapist & Family Counsellor",
    specialty: "Couples & Relationships", bio: "Dr. Al-Rashidi specialises in couples therapy, family systems, and Islamic-informed counselling. She holds a doctorate from King Abdulaziz University and is a licensed family therapist under SCFHS.",
    rating: 4.9, reviewCount: 89, yearsExperience: 11,
    imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 107, languages: ["Arabic", "English"], acceptsInsurance: false, nextAvailable: "Wed, 10:00 AM",
  },
  {
    name: "Dr. Marcus Weber", title: "Psychological Psychotherapist",
    specialty: "PTSD & Trauma", bio: "Dr. Weber trained at Charité – Universitätsmedizin Berlin and specialises in EMDR, somatic therapy, and trauma-informed care. Member of the Deutsche Gesellschaft für Psychologie.",
    rating: 4.8, reviewCount: 156, yearsExperience: 16,
    imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&auto=format",
    available: false, sessionPrice: 99, languages: ["German", "English", "French"], acceptsInsurance: true, nextAvailable: "Next week",
  },
  {
    name: "Dr. Priya Nair", title: "Clinical Psychologist & ADHD Specialist",
    specialty: "ADHD", bio: "Dr. Nair completed her PhD at NIMHANS Bangalore and specialises in ADHD across the lifespan, executive function coaching, and neurodiversity-affirming therapy. She's seen over 2,000 patients.",
    rating: 4.7, reviewCount: 241, yearsExperience: 12,
    imageUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 26, languages: ["English", "Hindi", "Malayalam"], acceptsInsurance: false, nextAvailable: "Tomorrow, 11:00 AM",
  },
  {
    name: "Dr. Layla Hassan", title: "Child & Adolescent Psychiatrist",
    specialty: "Child & Adolescent", bio: "Dr. Hassan holds board certification from the Arab Board of Psychiatry and specialises in autism spectrum, childhood anxiety, and family therapy. Based in Dubai, she works with UAE's multicultural population.",
    rating: 4.9, reviewCount: 74, yearsExperience: 9,
    imageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 136, languages: ["Arabic", "English", "French"], acceptsInsurance: true, nextAvailable: "Today, 6:00 PM",
  },
  {
    name: "Dr. Amara Diallo", title: "Therapist – Grief & Loss",
    specialty: "Grief & Loss", bio: "Dr. Diallo trained in Paris and specialises in bereavement, anticipatory grief, and existential therapy. She works with both adults and families using attachment theory and narrative therapy approaches.",
    rating: 4.8, reviewCount: 112, yearsExperience: 13,
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 95, languages: ["French", "English", "Wolof"], acceptsInsurance: false, nextAvailable: "Thu, 2:00 PM",
  },
  {
    name: "Dr. Karim Mansour", title: "Psychiatrist – Addiction Medicine",
    specialty: "Addiction & Recovery", bio: "Dr. Mansour trained at Ain Shams University and holds a diploma in addiction medicine from the Royal College of Psychiatrists (UK). He specialises in substance use disorders, dual diagnosis, and motivational interviewing.",
    rating: 4.7, reviewCount: 98, yearsExperience: 17,
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 30, languages: ["Arabic", "English"], acceptsInsurance: true, nextAvailable: "Tomorrow, 9:00 AM",
  },
  {
    name: "Dr. Sophie Leclerc", title: "Psychotherapist – CBT & ACT",
    specialty: "Anxiety & Stress", bio: "Dr. Leclerc completed her doctorate at Paris V Descartes and specialises in cognitive-behavioural therapy, acceptance & commitment therapy, and chronic pain psychology. Registered with ADELI.",
    rating: 4.9, reviewCount: 167, yearsExperience: 10,
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 95, languages: ["French", "English"], acceptsInsurance: false, nextAvailable: "Wed, 4:00 PM",
  },
  {
    name: "Dr. Omar Al-Mahmoud", title: "Clinical Psychologist",
    specialty: "Depression", bio: "Dr. Al-Mahmoud trained at the Jordan University of Science and Technology and specialises in major depressive disorder, seasonal affective disorder, and men's mental health.",
    rating: 4.6, reviewCount: 83, yearsExperience: 8,
    imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&auto=format",
    available: false, sessionPrice: 25, languages: ["Arabic", "English"], acceptsInsurance: false, nextAvailable: "Fri, 11:00 AM",
  },
  {
    name: "Dr. Mei-Ling Chen", title: "Psychiatrist & Mindfulness-Based Therapist",
    specialty: "OCD", bio: "Dr. Chen completed her residency at the University of Toronto and specialises in OCD, intrusive thoughts, and exposure therapy. She integrates mindfulness-based stress reduction into all treatment plans.",
    rating: 4.8, reviewCount: 145, yearsExperience: 15,
    imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 145, languages: ["English", "Mandarin", "Cantonese"], acceptsInsurance: true, nextAvailable: "Tomorrow, 8:00 AM",
  },
  {
    name: "Dr. Rania Qassem", title: "Clinical Psychologist",
    specialty: "PTSD & Trauma", bio: "Dr. Qassem trained at the Lebanese American University and specialises in complex trauma, sexual violence recovery, and EMDR therapy. She holds certification from the EMDR Institute International.",
    rating: 4.9, reviewCount: 62, yearsExperience: 10,
    imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 38, languages: ["Arabic", "French", "English"], acceptsInsurance: false, nextAvailable: "Mon, 3:00 PM",
  },
  {
    name: "Dr. Hamid Rezaei", title: "Psychiatrist, PhD",
    specialty: "Bipolar Disorder", bio: "Dr. Rezaei completed his fellowship at Maudsley Hospital London and specialises in bipolar disorder, psychosis, and psychopharmacology. He is a member of the World Psychiatric Association.",
    rating: 4.7, reviewCount: 189, yearsExperience: 22,
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 100, languages: ["English", "Persian", "Turkish"], acceptsInsurance: true, nextAvailable: "Today, 5:30 PM",
  },
  {
    name: "Dr. Aisha Traoré", title: "Child Psychologist & Play Therapist",
    specialty: "Child & Adolescent", bio: "Dr. Traoré trained in Casablanca and completed her MSc in Play Therapy at the University of Roehampton, London. She works with children 3–16 using play, art, and narrative therapy in Darija, French, and English.",
    rating: 4.8, reviewCount: 55, yearsExperience: 7,
    imageUrl: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 48, languages: ["French", "Arabic", "English"], acceptsInsurance: false, nextAvailable: "Tomorrow, 10:00 AM",
  },
  {
    name: "Dr. Ethan Clarke", title: "Counselling Psychologist",
    specialty: "Grief & Loss", bio: "Dr. Clarke trained at the University of Edinburgh and is registered with the British Psychological Society (BPS). He specialises in bereavement, adjustment disorders, and existential therapy.",
    rating: 4.8, reviewCount: 134, yearsExperience: 12,
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 89, languages: ["English"], acceptsInsurance: true, nextAvailable: "Wed, 9:00 AM",
  },
  {
    name: "Dr. Nour Al-Hamdan", title: "Psychiatrist – Women's Mental Health",
    specialty: "Depression", bio: "Dr. Al-Hamdan trained at King Saud University Medical College and specialises in perinatal psychiatry, postnatal depression, and women's hormonal mental health. She speaks Arabic and English and is a member of SCFHS.",
    rating: 4.9, reviewCount: 91, yearsExperience: 13,
    imageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 107, languages: ["Arabic", "English"], acceptsInsurance: true, nextAvailable: "Today, 7:00 PM",
  },
  {
    name: "Dr. Alessandro Ricci", title: "Psychoanalytic Therapist",
    specialty: "Anxiety & Stress", bio: "Dr. Ricci trained at the Università degli Studi di Roma and completed psychoanalytic training at the Italian Psychoanalytical Society. He works with chronic anxiety, identity issues, and relationship patterns.",
    rating: 4.7, reviewCount: 78, yearsExperience: 20,
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&auto=format",
    available: false, sessionPrice: 90, languages: ["Italian", "English", "French"], acceptsInsurance: false, nextAvailable: "Next week",
  },
  {
    name: "Dr. Salma Benali", title: "Clinical Psychologist & CBT Specialist",
    specialty: "Anxiety & Stress", bio: "Dr. Benali graduated from Mohammed V University and trained in CBT at the Oxford Cognitive Therapy Centre. She works with anxiety disorders, phobias, and chronic worry in Darija, French, and English.",
    rating: 4.8, reviewCount: 66, yearsExperience: 9,
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 48, languages: ["Arabic", "French", "English"], acceptsInsurance: false, nextAvailable: "Thu, 11:00 AM",
  },
  {
    name: "Dr. Yuki Tanaka", title: "Psychiatrist – Cross-cultural Mental Health",
    specialty: "Depression", bio: "Dr. Tanaka trained at Kyoto University and the Melbourne School of Population and Global Health. She specialises in depression, cross-cultural psychiatry, and international students' mental health.",
    rating: 4.7, reviewCount: 104, yearsExperience: 14,
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 130, languages: ["English", "Japanese"], acceptsInsurance: true, nextAvailable: "Tomorrow, 12:00 PM",
  },
  {
    name: "Dr. Tariq Al-Zahrani", title: "Clinical Psychologist",
    specialty: "Anxiety & Stress", bio: "Dr. Al-Zahrani trained at the University of Queensland and is registered with the Australian Psychology Board (AHPRA). He specialises in generalised anxiety, health anxiety, and mindfulness-based cognitive therapy.",
    rating: 4.8, reviewCount: 88, yearsExperience: 11,
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&auto=format&sat=-100",
    available: true, sessionPrice: 128, languages: ["English", "Arabic"], acceptsInsurance: true, nextAvailable: "Today, 4:00 PM",
  },
  {
    name: "Dr. Dina Mikhail", title: "Child Psychiatrist & Autism Specialist",
    specialty: "Child & Adolescent", bio: "Dr. Mikhail trained at Cairo University and completed her fellowship in Child Psychiatry at Great Ormond Street Hospital London. She specialises in autism spectrum, ADHD, and early childhood mental health.",
    rating: 4.9, reviewCount: 47, yearsExperience: 8,
    imageUrl: "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 30, languages: ["Arabic", "English"], acceptsInsurance: false, nextAvailable: "Wed, 2:00 PM",
  },
  {
    name: "Dr. Arjun Sharma", title: "Couples & Relationship Therapist",
    specialty: "Couples & Relationships", bio: "Dr. Sharma trained at the Tata Institute of Social Sciences and holds a Gottman Level 3 certification for couples therapy. He's worked with over 500 couples across India and internationally.",
    rating: 4.8, reviewCount: 143, yearsExperience: 15,
    imageUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 26, languages: ["English", "Hindi", "Punjabi"], acceptsInsurance: false, nextAvailable: "Fri, 3:00 PM",
  },
  {
    name: "Dr. Hana Kovač", title: "Psychologist – Burnout & Resilience",
    specialty: "Anxiety & Stress", bio: "Dr. Kovač trained at Charles University Prague and specialises in occupational burnout, resilience-building, and stress management for professionals. She uses solution-focused and schema therapy approaches.",
    rating: 4.6, reviewCount: 59, yearsExperience: 8,
    imageUrl: "https://images.unsplash.com/photo-1607990283143-e81e7a2c9349?w=400&h=400&fit=crop&auto=format",
    available: true, sessionPrice: 80, languages: ["English", "Czech", "German"], acceptsInsurance: false, nextAvailable: "Mon, 10:00 AM",
  },
  {
    name: "Dr. Bassem Qattoum", title: "Psychiatrist, MD – General Adult",
    specialty: "Psychiatry", bio: "Dr. Qattoum trained at the Jordan Medical Association and specialises in adult psychiatry, schizophrenia, mood disorders, and psychopharmacology. He holds a Certificate of Training in Addiction from WHO.",
    rating: 4.7, reviewCount: 116, yearsExperience: 19,
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&auto=format&hue=20",
    available: false, sessionPrice: 30, languages: ["Arabic", "English"], acceptsInsurance: true, nextAvailable: "Next Mon",
  },
];

async function main() {
  console.log("🌱 Seeding providers...");
  try {
    await db.delete(schema.providersTable);
    for (const p of PROVIDERS) {
      await db.insert(schema.providersTable).values(p);
    }
    console.log(`✅ Inserted ${PROVIDERS.length} providers`);
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await pool.end();
  }
}

main();
