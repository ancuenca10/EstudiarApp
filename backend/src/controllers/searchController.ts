import { Request, Response } from 'express';
import University from '../models/University';

export const searchController = {
  // Búsqueda avanzada con filtros
  advancedSearch: async (req: Request, res: Response) => {
    try {
      const {
        searchTerm,
        types,
        city,
        programLevels,
        modalities,
        minPrice,
        maxPrice,
        accreditation
      } = req.query;

      // Construir query de búsqueda
      let query: any = {};

      // Búsqueda por texto
      if (searchTerm) {
        const searchRegex = new RegExp(searchTerm as string, 'i');
        query.$or = [
          { name: searchRegex },
          { city: searchRegex },
          { 'contact.email': searchRegex },
          { 'programs.name': searchRegex }
        ];
      }

      // Filtro por tipo
      if (types) {
        const typeArray = Array.isArray(types) ? types : [types];
        query.type = { $in: typeArray };
      }

      // Filtro por ciudad
      if (city) {
        query.city = city;
      }

      // Filtro por acreditación
      if (accreditation) {
        query.accreditation = accreditation;
      }

      // Filtros anidados para programas
      let programFilters: any = {};
      
      if (programLevels) {
        const levelArray = Array.isArray(programLevels) ? programLevels : [programLevels];
        programFilters['programs.level'] = { $in: levelArray };
      }

      if (modalities) {
        const modalityArray = Array.isArray(modalities) ? modalities : [modalities];
        programFilters['programs.modality'] = { $in: modalityArray };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        programFilters['programs.price'] = {};
        if (minPrice !== undefined) programFilters['programs.price'].$gte = Number(minPrice);
        if (maxPrice !== undefined) programFilters['programs.price'].$lte = Number(maxPrice);
      }

      // Aplicar filtros de programas si existen
      if (Object.keys(programFilters).length > 0) {
        query.$and = query.$and || [];
        query.$and.push(programFilters);
      }

      console.log('Query de búsqueda:', JSON.stringify(query, null, 2));

      const universities = await University.find(query)
        .sort({ name: 1 })
        .lean();

      res.json({
        success: true,
        count: universities.length,
        data: universities
      });

    } catch (error) {
      console.error('Error en búsqueda avanzada:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor en la búsqueda'
      });
    }
  },

  // Obtener ciudades únicas para el dropdown
  getCities: async (req: Request, res: Response) => {
    try {
      const cities = await University.distinct('city');
      res.json({
        success: true,
        data: cities.sort()
      });
    } catch (error) {
      console.error('Error obteniendo ciudades:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo ciudades'
      });
    }
  },

  // Obtener estadísticas para filtros
  getFilterStats: async (req: Request, res: Response) => {
    try {
      const [types, accreditations, programLevels, modalities] = await Promise.all([
        University.distinct('type'),
        University.distinct('accreditation'),
        University.distinct('programs.level'),
        University.distinct('programs.modality')
      ]);

      res.json({
        success: true,
        data: {
          types: types.sort(),
          accreditations: accreditations.sort(),
          programLevels: programLevels.sort(),
          modalities: modalities.sort()
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de filtros:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas de filtros'
      });
    }
  },

  // Búsqueda rápida por texto
  quickSearch: async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Término de búsqueda requerido'
        });
      }

      const searchRegex = new RegExp(q as string, 'i');

      const universities = await University.find({
        $or: [
          { name: searchRegex },
          { city: searchRegex },
          { 'contact.email': searchRegex },
          { 'programs.name': searchRegex },
          { 'programs.description': searchRegex }
        ]
      })
      .select('name city type accreditation programs.name programs.level')
      .limit(10)
      .lean();

      res.json({
        success: true,
        count: universities.length,
        data: universities
      });

    } catch (error) {
      console.error('Error en búsqueda rápida:', error);
      res.status(500).json({
        success: false,
        error: 'Error en búsqueda rápida'
      });
    }
  }
};