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

export function VehicleAppraisalForm({
  onVinChange,
  onAnalyze,
  onUpload,
  vin = "",
  photos = [],
  uploadProgress,
  isUploading = false,
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

      <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
        <Input
          placeholder="Enter VIN"
          value={vin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onVinChange?.(e.target.value)
          }
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
      <UploadArea onUpload={onUpload} />

      <div className="flex px-4 py-3 justify-start">
        <Button disabled={vin.length === 0} onClick={onAnalyze}>
          Analyze Vehicle
        </Button>
      </div>
    </div>
  );
}
