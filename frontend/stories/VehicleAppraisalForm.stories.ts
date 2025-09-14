import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { VehicleAppraisalForm } from '../components/organisms/VehicleAppraisalForm';
import { type Photo } from '../components/molecules/PhotoGrid';

const meta = {
  title: 'Organisms/VehicleAppraisalForm',
  component: VehicleAppraisalForm,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onVinChange: fn(),
    onMileageChange: fn(),
    onAnalyze: fn(),
    onUpload: fn(),
    onNotesChange: fn(),
  },
} satisfies Meta<typeof VehicleAppraisalForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockPhotos: Photo[] = [
  { id: '1', url: 'https://via.placeholder.com/200x200?text=Front+View', alt: 'Front view' },
  { id: '2', url: 'https://via.placeholder.com/200x200?text=Side+View', alt: 'Side view' },
  { id: '3', url: 'https://via.placeholder.com/200x200?text=Rear+View', alt: 'Rear view' },
];

export const Default: Story = {
  args: {},
};

export const WithData: Story = {
  args: {
    vin: 'JTDKN3DU0A0318565',
    mileage: '45000',
    notes: 'Vehicle has minor scratches on front bumper but otherwise in good condition.',
    photos: mockPhotos,
  },
};

export const Uploading: Story = {
  args: {
    vin: 'JTDKN3DU0A0318565',
    mileage: '45000',
    photos: mockPhotos,
    isUploading: true,
    uploadProgress: { current: 2, total: 3 },
  },
};

export const Submitting: Story = {
  args: {
    vin: 'JTDKN3DU0A0318565',
    mileage: '45000',
    notes: 'Ready for analysis',
    photos: mockPhotos,
    isSubmitting: true,
  },
};

export const InProgress: Story = {
  args: {
    vin: 'JTDKN3DU0A0318565',
    mileage: '45000',
    notes: 'Analysis in progress...',
    photos: mockPhotos,
    isSubmitting: true,
    isUploading: false,
  },
};