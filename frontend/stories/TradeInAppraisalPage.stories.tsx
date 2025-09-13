import type { Meta, StoryObj } from '@storybook/react-vite';
import { TradeInAppraisalPage, defaultTradeInData } from '../components/pages/TradeInAppraisalPage';
import { Car, Armchair, CircleDot, AlertTriangle, Wrench } from 'lucide-react';
import React from 'react';

const meta = {
  title: 'Pages/TradeInAppraisalPage',
  component: TradeInAppraisalPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    visualScore: {
      control: { type: 'range', min: 0, max: 10, step: 0.1 }
    },
    aiConfidence: {
      control: { type: 'range', min: 0, max: 100, step: 1 }
    }
  }
} satisfies Meta<typeof TradeInAppraisalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultTradeInData,
};

export const ExcellentCondition: Story = {
  args: {
    ...defaultTradeInData,
    visualScore: 9.5,
    scoreDescription: "Exceptional condition, like new",
    conditionIssues: [
      {
        id: "minor-wear",
        title: "Minor Wear",
        description: "Very minimal wear on door handles",
        icon: <Car size={24} />
      }
    ],
    marketValueRange: "$21,000 - $23,000",
    tradeInValue: "$22,100",
    aiConfidence: 98,
  },
};

export const PoorCondition: Story = {
  args: {
    ...defaultTradeInData,
    visualScore: 4.2,
    scoreDescription: "Below average condition with multiple issues",
    conditionIssues: [
      {
        id: "damage",
        title: "Body Damage",
        description: "Significant dents on driver side door",
        icon: <AlertTriangle size={24} />
      },
      {
        id: "interior-damage",
        title: "Interior Damage",
        description: "Torn upholstery and stained carpets",
        icon: <Armchair size={24} />
      },
      {
        id: "mechanical",
        title: "Mechanical Issues",
        description: "Engine needs maintenance, brakes worn",
        icon: <Wrench size={24} />
      },
      {
        id: "tires-worn",
        title: "Tire Condition",
        description: "Tires need replacement soon",
        icon: <CircleDot size={24} />
      }
    ],
    marketValueRange: "$12,000 - $14,000",
    tradeInValue: "$13,250",
    aiConfidence: 87,
    aiConfidenceDescription: "Good confidence despite condition issues",
  },
};

export const LuxuryVehicle: Story = {
  args: {
    ...defaultTradeInData,
    vehicleDetails: {
      make: "BMW",
      model: "X5 M Sport",
      year: "2020",
      mileage: "35,000 miles",
      vin: "5UXCR6C0XL9ABC123"
    },
    visualScore: 8.8,
    scoreDescription: "Premium condition with minor wear consistent with age",
    marketValueRange: "$45,000 - $48,000",
    tradeInValue: "$46,750",
    aiConfidence: 94,
  },
};

export const HighMileage: Story = {
  args: {
    ...defaultTradeInData,
    vehicleDetails: {
      ...defaultTradeInData.vehicleDetails,
      year: "2015",
      mileage: "145,000 miles",
    },
    visualScore: 6.5,
    scoreDescription: "Fair condition with wear consistent with high mileage",
    marketValueRange: "$8,500 - $10,500",
    tradeInValue: "$9,250",
    aiConfidence: 92,
  },
};