// components/pages/VehicleAppraisalPage.tsx
import * as React from "react";
import { PageLayout } from "components/templates/PageLayout";
import { VehicleAppraisalForm } from "components/organisms/VehicleAppraisalForm";
import { type Photo } from "components/molecules/PhotoGrid";

export interface VehicleAppraisalPageProps {
  onVinChange?: (vin: string) => void;
  onAnalyze?: () => void;
  onUpload?: (files: FileList) => void;
  vin?: string;
  photos?: Photo[];
  uploadProgress?: {
    current: number;
    total: number;
  };
  isUploading?: boolean;
}

export function VehicleAppraisalPage(props: VehicleAppraisalPageProps) {
  // Local state management
  const [vin, setVin] = React.useState(props.vin || "");
  const [photos, setPhotos] = React.useState<Photo[]>(props.photos || []);
  const [uploadProgress, setUploadProgress] = React.useState<{ current: number; total: number } | undefined>(props.uploadProgress);
  const [isUploading, setIsUploading] = React.useState(props.isUploading || false);

  // Handlers
  const handleVinChange = (newVin: string) => {
    setVin(newVin);
    props.onVinChange?.(newVin);
  };

  const handleUpload = (files: FileList) => {
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    // Simulate file upload process
    const newPhotos: Photo[] = [];
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPhotos.push({
            id: `${Date.now()}-${index}`,
            url: e.target.result as string,
            alt: file.name,
          });

          setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : undefined);

          if (newPhotos.length === files.length) {
            setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
            setIsUploading(false);
            setUploadProgress(undefined);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    props.onUpload?.(files);
  };

  const handleAnalyze = () => {
    // Placeholder for analysis logic
    console.log("Analyzing vehicle with VIN:", vin, "and photos:", photos);
    props.onAnalyze?.();
  };

  return (
    <PageLayout>
      <VehicleAppraisalForm
        vin={vin}
        photos={photos}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        onVinChange={handleVinChange}
        onUpload={handleUpload}
        onAnalyze={handleAnalyze}
      />
    </PageLayout>
  );
}
