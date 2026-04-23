
import axios from "axios";
import type { University } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const universityService = {
  async getAllUniversities(): Promise<University[]> {
    const response = await api.get("/universities");
    return response.data;
  },

  async searchUniversities(query: string): Promise<University[]> {
    const response = await api.get(`/universities/search?q=${query}`);
    return response.data;
  },

  async getUniversitiesByCity(city: string): Promise<University[]> {
    const response = await api.get(`/universities/city/${city}`);
    return response.data;
  },

  async getUniversityById(id: string): Promise<University> {
    const response = await api.get(`/universities/${id}`);
    return response.data;
  }
};
