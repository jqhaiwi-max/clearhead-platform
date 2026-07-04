import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, ArrowLeft, Clock, Globe, Shield, CheckCircle } from "lucide-react";
import { useGetProvider } from "@workspace/api-client-react";

interface Props {
  id: string;
}

export default function ProviderDetail({ id }: Props) {
  const { data: provider, isLoading } = useGetProvider(parseInt(id), {
    query: { enabled: !!id },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 rounded-2xl bg-muted animate-pulse mb-6" />
          <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Provider not found</h2>
          <Link href="/providers" className="text-primary hover:underline">Back to providers</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <Link href="/providers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to providers
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-card border border-border rounded-2xl overflow-hidden sticky top-24"
              >
                <div className="relative h-64 bg-muted">
                  <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
                  {provider.available && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Available
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h1 className="font-serif text-xl font-bold text-foreground mb-0.5">{provider.name}</h1>
                  <p className="text-sm text-muted-foreground mb-3">{provider.title}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-sm">{provider.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
                  </div>
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{provider.yearsExperience} years of experience</span>
                    </div>
                    {provider.languages && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{provider.languages.join(", ")}</span>
                      </div>
                    )}
                    {provider.acceptsInsurance && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Accepts insurance</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Board certified</span>
                    </div>
                  </div>
                  {provider.nextAvailable && (
                    <p className="text-xs text-muted-foreground mb-4 bg-muted px-3 py-2 rounded-lg">
                      Next available: <span className="font-medium text-foreground">{provider.nextAvailable}</span>
                    </p>
                  )}
                  <div className="border-t border-border pt-4 mb-5">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-serif text-2xl font-bold text-foreground">${provider.sessionPrice}</span>
                      <span className="text-sm text-muted-foreground">/session</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Video, phone, or messaging</p>
                  </div>
                  <Link
                    href={`/book?provider=${provider.id}`}
                    className="block w-full text-center py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Book a Session
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">About {provider.name}</h2>
                <p className="text-foreground/80 leading-relaxed">{provider.bio}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">Areas of Focus</h2>
                <div className="flex flex-wrap gap-2">
                  {[provider.specialty, "Evidence-based treatment", "Medication management", "Psychotherapy", "Telehealth"].map((tag) => (
                    <span key={tag} className="text-sm px-3 py-1.5 rounded-full bg-accent text-accent-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">Session Types</h2>
                <div className="grid grid-cols-3 gap-4">
                  {["Video", "Phone", "Messaging"].map((type) => (
                    <div key={type} className="text-center p-4 rounded-xl bg-muted">
                      <div className="text-sm font-semibold text-foreground">{type}</div>
                      <div className="text-xs text-muted-foreground mt-1">Available</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4"
              >
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Your privacy is protected</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All sessions are fully encrypted and HIPAA-compliant. Your records are private and never shared without your explicit consent.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
