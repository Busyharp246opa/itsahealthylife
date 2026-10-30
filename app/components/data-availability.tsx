"use client";

import { createContext, useContext } from "react";

export const DataAvailableContext = createContext(true);
export const useDataAvailable = () => useContext(DataAvailableContext);
