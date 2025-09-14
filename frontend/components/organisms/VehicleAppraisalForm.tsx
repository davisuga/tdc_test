// components/organisms/VehicleAppraisalForm.tsx
import * as React from "react";
import { Button } from "components/atoms/Button";
import { Input } from "components/atoms/Input";
import { Title, Description, Subtitle } from "components/atoms/Typography";
import { UploadArea } from "components/molecules/UploadArea";
import { PhotoGrid, type Photo } from "components/molecules/PhotoGrid";
import { ProgressSection } from "components/molecules/ProgressSection";

export interface VehicleAppraisalFormProps {
  onVinChange?: (vin: string) => void;
  onMileageChange?: (mileage: string) => void;
  onAnalyze?: () => void;
  onUpload?: (files: FileList) => void;
  onNotesChange?: (notes: string) => void;
  vin?: string;
  mileage?: string;
  notes?: string;
  photos?: Photo[];
  uploadProgress?: {
    current: number;
    total: number;
  };
  isUploading?: boolean;
  isSubmitting?: boolean;
}

export function VehicleAppraisalForm({
  onVinChange,
  onMileageChange,
  onAnalyze,
  onUpload,
  onNotesChange,
  vin = "",
  mileage = "",
  notes = "",
  photos = [],
  uploadProgress,
  isUploading = false,
  isSubmitting = false,
}: VehicleAppraisalFormProps) {
  return (
    <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <Title>Vehicle Appraisal</Title>
          <Description>
            Enter the Vehicle Identification Number (VIN) or upload photos to
            begin the appraisal process.
          </Description>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 px-4 py-3">
        <Input
          className="max-w-[240px]"
          placeholder="Enter VIN"
          value={vin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onVinChange?.(e.target.value)
          }
          disabled={isSubmitting}
        />
        <Input
          className="max-w-[240px]"
          placeholder="Mileage"
          type="number"
          value={mileage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onMileageChange?.(e.target.value)
          }
          disabled={isSubmitting}
        />
        <textarea
          placeholder="Notes about the vehicle (optional)"
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onNotesChange?.(e.target.value)
          }
          className="mt-2 w-full rounded-md border p-4"
          disabled={isSubmitting}
        />
      </div>

      <Subtitle className="px-4 pb-3 pt-5">Upload Vehicle Photos</Subtitle>

      {photos.length > 0 && (
        <>
          <PhotoGrid photos={photos} />
          {isUploading && uploadProgress && (
            <ProgressSection
              current={uploadProgress.current}
              total={uploadProgress.total}
            />
          )}
        </>
      )}
      <UploadArea onUpload={onUpload} disabled={isSubmitting} />

      <div className="flex px-4 py-3 justify-start">
        <Button disabled={vin.length === 0 || isUploading || isSubmitting} onClick={onAnalyze}>
          {isSubmitting ? "Submitting..." : "Analyze Vehicle"}
        </Button>
      </div>
    </div>
  );
}
