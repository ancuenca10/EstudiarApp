import { Schema, model, Document, Types } from 'mongoose';

export interface IProgram {
  _id?: Types.ObjectId;
  name: string;
  level: 'Técnico' | 'Tecnológico' | 'Pregrado' | 'Posgrado';
  duration: string;
  price: number;
  modality: 'Presencial' | 'Virtual' | 'Híbrido';
  requirements: string[];
  schedule: string;
  description: string;
}

export interface IUniversity extends Document {
  name: string;
  city: string;
  type: 'Pública' | 'Privada';
  accreditation: string;
  programs: IProgram[];
  contact: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
  logo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProgramSchema = new Schema<IProgram>({
  name: { type: String, required: true },
  level: { 
    type: String, 
    required: true, 
    enum: ['Técnico', 'Tecnológico', 'Pregrado', 'Posgrado'] 
  },
  duration: { type: String, required: true },
  price: { type: Number, required: true },
  modality: { 
    type: String, 
    required: true, 
    enum: ['Presencial', 'Virtual', 'Híbrido'] 
  },
  requirements: [{ type: String }],
  schedule: { type: String, required: true },
  description: { type: String, required: true }
}, {
  _id: true,
  timestamps: false
});

const UniversitySchema = new Schema<IUniversity>({
  name: { type: String, required: true },
  city: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['Pública', 'Privada'] 
  },
  accreditation: { type: String, default: 'En proceso' },
  programs: [ProgramSchema],
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    website: { type: String, required: true }
  },
  logo: { type: String }
}, {
  timestamps: true
});

export default model<IUniversity>('University', UniversitySchema);