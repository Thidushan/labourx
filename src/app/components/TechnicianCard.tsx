import { Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Briefcase,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Technician } from "../types";

interface TechnicianCardProps {
  technician: Technician;
  featured?: boolean;
}

export function TechnicianCard({
  technician,
  featured = false,
}: TechnicianCardProps) {
  const availabilityColors = {
    Available:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Busy: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Limited:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <div
      className={`bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${featured ? "ring-2 ring-gold" : ""}`}
    >
      {featured && (
        <div
          className="bg-gold text-white text-xs text-center py-1 px-2"
          style={{ fontWeight: 600 }}
        >
          ⭐ Featured Professional
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={technician.avatar}
              alt={technician.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-maroon/20"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(technician.name)}&background=8B1A2F&color=fff`;
              }}
            />
            {technician.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-maroon rounded-full p-0.5">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  className="text-card-foreground truncate"
                  style={{ fontWeight: 600 }}
                >
                  {technician.name}
                </h3>
                <p
                  className="text-maroon text-sm"
                  style={{ fontWeight: 500 }}
                >
                  {technician.specialty}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${availabilityColors[technician.availability]}`}
                style={{ fontWeight: 500 }}
              >
                {technician.availability}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span
                className="text-sm"
                style={{ fontWeight: 600 }}
              >
                {technician.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-sm">
                ({technician.reviewCount} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {technician.location}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {technician.yearsExperience} years experience
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {technician.completedProjects} projects completed
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {technician.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-0.5 rounded-full bg-maroon-light text-maroon border border-maroon/10"
            >
              {skill}
            </span>
          ))}
          {technician.skills.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{technician.skills.length - 3} more
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span
              className="text-gold"
              style={{ fontWeight: 700 }}
            >
              {technician.hourlyRate}
            </span>
          </div>
          <Link
            to={`/technician/${technician.id}`}
            className="bg-maroon text-white px-4 py-1.5 rounded-lg text-sm hover:bg-maroon-dark transition-colors"
            style={{ fontWeight: 500 }}
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}