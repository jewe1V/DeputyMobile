import { AxiosError } from 'axios';
import { apiClient } from './api';

export interface CreateTaskPayload {
  title: string;
  description: string;
  expected_end_date: string;
  priority: number | null;
  status: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  expectedEndDate: string;
  priority: number;
  status: string;
  [key: string]: any;
}

class TaskService {
  async createTask(payload: CreateTaskPayload): Promise<Task> {
    try {
      const response = await apiClient.post<Task>('/api/task/create', payload);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
      throw error;
    }
  }

  async getStatuses(): Promise<{ name: string; isDefault: boolean }[]> {
    try {
      const response = await apiClient.get<{ name: string; isDefault: boolean }[]>('/api/Status/get-all');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки статусов:', error);
      throw new Error('Ошибка загрузки статусов');
    }
  }

  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>('/api/task/get-tasks');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Ошибка при получении задач:', error);
      throw error;
    }
  }

  async getTasksByCurrentUser(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>('/api/task/get-tasks-by-current-user');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Ошибка при получении задач:', error);
      throw error;
    }
  }

  async getAssignedTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>('/api/task/get-assigned-tasks');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Ошибка при получении задач:', error);
      throw error;
    }
  }

  async getAuthorTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>('/api/task/get-author-tasks');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Ошибка при получении задач:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/task/delete/${id}`);
    } catch (error) {
      console.error('Ошибка при удалении задач:', error);
      throw error;
    }
  }

  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await apiClient.get<Task>(`/api/task/get-task/${id}`);
      console.log('[TaskService] Задача успешно получена:', response.data);
      return response.data;
    } catch (error) {
      console.error('[TaskService] Ошибка при получении задачи:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, payload: CreateTaskPayload): Promise<void> {
    try {
      await apiClient.post(`/api/task/update/${taskId}`, payload);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const errorText = typeof axiosError.response.data === 'string'
            ? axiosError.response.data
            : JSON.stringify(axiosError.response.data);
        throw new Error(errorText || 'Ошибка при обновлении задачи');
      }
      throw error;
    }
  }
}

export const taskService = new TaskService();
