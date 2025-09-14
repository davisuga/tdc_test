// utils/iconUtils.tsx
import * as React from "react";
import { 
  Car, 
  Armchair, 
  CircleDot, 
  Wrench, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Zap
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  Car,
  Armchair,
  CircleDot,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Zap,
};

export const getIconFromString = (iconString: string, size: number = 24): React.ReactNode => {
  const IconComponent = iconMap[iconString];
  if (!IconComponent) {
    // Fallback to a default icon if the string doesn't match
    return <Info size={size} />;
  }
  return <IconComponent size={size} />;
};
