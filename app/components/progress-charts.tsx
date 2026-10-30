"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { date: string; label: string; [metric: string]: number | string };

export function ReadinessChart({ data }: { data: Point[] }) {
  return <div className="fc-chart" role="img" aria-label="Mood and energy over the recorded days">
    <ResponsiveContainer width="100%" height={250}><AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="var(--fc-border, #33424c)" strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} /><Tooltip /><Legend /><Area type="monotone" dataKey="mood" name="Mood" stroke="#22c6b7" fill="#22c6b7" fillOpacity={0.24} /><Area type="monotone" dataKey="energy" name="Energy" stroke="#d2a8ff" fill="#d2a8ff" fillOpacity={0.15} /></AreaChart></ResponsiveContainer>
  </div>;
}

export function IntakeChart({ data }: { data: Point[] }) {
  return <div className="fc-chart" role="img" aria-label="Calories entered for each logged day">
    <ResponsiveContainer width="100%" height={250}><BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="var(--fc-border, #33424c)" strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="calories" name="Entered kcal" fill="#f7b46a" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
  </div>;
}

export function VolumeChart({ data }: { data: Point[] }) {
  return <div className="fc-chart" role="img" aria-label="Logged strength training volume by completed session">
    <ResponsiveContainer width="100%" height={250}><BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="var(--fc-border, #33424c)" strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="volume" name="Logged kg × reps" fill="#55d5c7" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
  </div>;
}
