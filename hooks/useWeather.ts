import { useState, useEffect } from "react";

export function getDetailedWeatherAdvice(
  currentTemp: number,
  minTemp: number,
  maxTemp: number,
  rainProb: number,
  weatherCode: number
) {
  const parts: string[] = [];
  if (rainProb >= 50 || (weatherCode >= 51 && weatherCode <= 67)) {
    parts.push(`🌧️ Regen gemeldet (${rainProb}% Risiko) – Schirm oder Regenjacke einpacken!`);
  }
  const tempDiff = maxTemp - minTemp;
  if (tempDiff >= 9 && maxTemp >= 20 && minTemp <= 13) {
    parts.push(
      `🧥 Morgens frisch (${minTemp}°C), mittags warm (${maxTemp}°C) – Zwiebellook empfohlen!`
    );
  } else if (maxTemp >= 25) {
    parts.push(`☀️ Heute wird es heiß (bis ${maxTemp}°C) – T-Shirt & leichte Kleidung genügen.`);
  } else if (maxTemp <= 8) {
    parts.push(`🧣 Bleibt kalt (max. ${maxTemp}°C) – dicke Jacke & Schal mitnehmen.`);
  } else if (maxTemp <= 15) {
    parts.push(`🧥 Mäßig kühl (bis ${maxTemp}°C) – Übergangsjacke anziehen.`);
  } else {
    parts.push(`🌤️ Angenehm mild (bis ${maxTemp}°C).`);
  }
  return parts.join(" ");
}

export function useWeather() {
  const [weather, setWeather] = useState<string>("Lädt...");
  const [weatherTip, setWeatherTip] = useState<string>("Guten Tag!");
  const [locationName, setLocationName] = useState<string>("Erfurt");

  useEffect(() => {
    const fetchWeatherForCoords = async (lat: number, lon: number, cityName?: string) => {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
        );
        const data = await weatherRes.json();
        const curr = Math.round(data?.current?.temperature_2m ?? 0);
        const code = data?.current?.weather_code ?? 0;
        const minT = Math.round(data?.daily?.temperature_2m_min?.[0] ?? curr);
        const maxT = Math.round(data?.daily?.temperature_2m_max?.[0] ?? curr);
        const rainP = data?.daily?.precipitation_probability_max?.[0] ?? 0;

        setWeather(`${curr}°C`);
        setWeatherTip(getDetailedWeatherAdvice(curr, minT, maxT, rainP, code));

        if (cityName) {
          setLocationName(cityName);
        } else {
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=de`
            );
            const geoData = await geoRes.json();
            setLocationName(geoData.city || geoData.locality || "Vor Ort");
          } catch {
            setLocationName("Vor Ort");
          }
        }
      } catch {
        setWeather("--");
        setWeatherTip("Wetterdaten nicht verfügbar");
      }
    };

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherForCoords(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeatherForCoords(50.9803, 11.0291, "Erfurt"),
        { timeout: 8000 }
      );
    } else {
      fetchWeatherForCoords(50.9803, 11.0291, "Erfurt");
    }
  }, []);

  return { weather, weatherTip, locationName };
}
