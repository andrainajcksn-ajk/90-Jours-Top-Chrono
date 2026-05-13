import { create } from 'zustand';

const useStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  tasks: [],
  startTime: null,
  tasksLocked: false,

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, tasks: [], startTime: null, tasksLocked: false });
  },
  setTasks: (tasks) => set({ tasks }),
  setStartTime: (t) => set({ startTime: t }),
  setTasksLocked: (v) => set({ tasksLocked: v }),
}));

export default useStore;