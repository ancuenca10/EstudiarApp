import { Request, Response } from 'express';
import University from '../models/University';

// ✅ CONTROLADORES NUEVOS (AGREGAR ESTOS)
export const getUniversities = async (req: Request, res: Response) => {
  try {
    const universities = await University.find();
    res.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener universidades' });
  }
};

export const getUniversityById = async (req: Request, res: Response) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ error: 'Universidad no encontrada' });
    }
    res.json(university);
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ TUS CONTROLADORES EXISTENTES
export const createUniversity = async (req: Request, res: Response) => {
  try {
    const university = new University(req.body);
    await university.save();
    res.status(201).json(university);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear universidad' });
  }
};

export const updateUniversity = async (req: Request, res: Response) => {
  try {
    const university = await University.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!university) {
      return res.status(404).json({ error: 'Universidad no encontrada' });
    }
    res.json(university);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar universidad' });
  }
};

export const deleteUniversity = async (req: Request, res: Response) => {
  try {
    const university = await University.findByIdAndDelete(req.params.id);
    if (!university) {
      return res.status(404).json({ error: 'Universidad no encontrada' });
    }
    res.json({ message: 'Universidad eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar universidad' });
  }
};

export const addProgram = async (req: Request, res: Response) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ error: 'Universidad no encontrada' });
    }

    university.programs.push(req.body);
    await university.save();

    res.json(university);
  } catch (error) {
    res.status(400).json({ error: 'Error al agregar programa' });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ error: 'Universidad no encontrada' });
    }

    const programIndex = university.programs.findIndex(
      (p: any) => p._id.toString() === req.params.programId
    );

    if (programIndex === -1) {
      return res.status(404).json({ error: 'Programa no encontrado' });
    }

    // ✅ SOLUCIÓN ELEGANTE: Actualizar solo los campos enviados
    const program = university.programs[programIndex];
    Object.assign(program, req.body);

    await university.save();
    res.json(university);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar programa' });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ error: 'Universidad no encontrada' });
    }

    university.programs = university.programs.filter(
      (p: any) => p._id.toString() !== req.params.programId
    );

    await university.save();
    res.json(university);
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar programa' });
  }
};