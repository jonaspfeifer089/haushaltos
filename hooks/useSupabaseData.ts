import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  TodoItem,
  EinkaufItem,
  GymItem,
  PutzItem,
  VorratItem,
  CountdownItem,
  NoteItem
} from "../types";

export function useSupabaseData() {
  const [einkauf, setEinkauf] = useState<EinkaufItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [gymData, setGymData] = useState<GymItem[]>([]);
  const [aufgaben, setAufgaben] = useState<PutzItem[]>([]);
  const [vorrat, setVorrat] = useState<VorratItem[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  useEffect(() => {
    const fetchSupabase = async () => {
      const [todosRes, einkaufRes, gymRes, haushaltRes, vorratRes, cdRes, notesRes] =
        await Promise.all([
          supabase.from("todos").select("*"),
          supabase.from("einkauf").select("*"),
          supabase.from("gym").select("*"),
          supabase.from("haushalt").select("*"),
          supabase.from("vorrat").select("*"),
          supabase.from("countdowns").select("*"),
          supabase.from("notizen").select("*")
        ]);
      if (todosRes.data) setTodos(todosRes.data);
      if (einkaufRes.data) setEinkauf(einkaufRes.data);
      if (gymRes.data) setGymData(gymRes.data);
      if (haushaltRes.data) setAufgaben(haushaltRes.data);
      if (vorratRes.data) setVorrat(vorratRes.data);
      if (cdRes.data) setCountdowns(cdRes.data);
      if (notesRes.data) setNotes(notesRes.data);
    };
    fetchSupabase();

    const handlePayload = (payload: any, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
      if (payload.eventType === "INSERT")
        setState((prev) =>
          prev.find((item) => item.id === payload.new.id) ? prev : [...prev, payload.new]
        );
      else if (payload.eventType === "UPDATE")
        setState((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)));
      else if (payload.eventType === "DELETE")
        setState((prev) => prev.filter((item) => item.id !== payload.old.id));
    };

    const channel = supabase
      .channel("schema-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "todos" }, (p) =>
        handlePayload(p, setTodos)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "einkauf" }, (p) =>
        handlePayload(p, setEinkauf)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "gym" }, (p) =>
        handlePayload(p, setGymData)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "haushalt" }, (p) =>
        handlePayload(p, setAufgaben)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "vorrat" }, (p) =>
        handlePayload(p, setVorrat)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    todos,
    setTodos,
    einkauf,
    setEinkauf,
    gymData,
    setGymData,
    aufgaben,
    setAufgaben,
    vorrat,
    setVorrat,
    countdowns,
    setCountdowns,
    notes,
    setNotes
  };
}
