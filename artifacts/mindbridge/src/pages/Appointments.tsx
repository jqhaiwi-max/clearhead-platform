import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calendar, Clock, Video, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { useListAppointments } from "@workspace/api-client-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const typeIcons: Record<string, React.ElementType> = {
  video: Video,
  phone: Phone,
  messaging: MessageSquare,
};

export default function Appointments() {
  const { data: appointments, isLoading } = useListAppointments();

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">My Appointments</h1>
          <p className="text-muted-foreground text-lg">Track and manage your scheduled sessions.</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center py-20 bg-card border border-border rounded-2xl"
          >
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">No appointments yet</h3>
            <p className="text-muted-foreground mb-6">Book your first session with one of our providers.</p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Book a session <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {[...appointments].reverse().map((apt, i) => {
              const TypeIcon = typeIcons[apt.type] ?? Video;
              const statusClass = statusColors[apt.status] ?? "bg-muted text-muted-foreground";
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-foreground">{apt.providerName}</h3>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusClass}`}>
                            {apt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {apt.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {apt.time}
                          </span>
                          <span className="capitalize">{apt.type} session</span>
                        </div>
                        {apt.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">{apt.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Patient</p>
                      <p className="text-sm font-medium text-foreground">{apt.patientName}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center pt-6"
            >
              <Link href="/book" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-200">
                Book another session <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
