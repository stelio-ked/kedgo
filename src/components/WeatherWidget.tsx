import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  Thermometer,
  Wind,
  AlertCircle,
} from "lucide-react";
import { Destination, ItineraryDay } from "../types";

interface WeatherWidgetProps {
  destination: Destination | undefined;
  activeDay: ItineraryDay | undefined;
}

interface WeatherData {
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  dateStr: string;
}

const parseDateFromPortugueseStr = (dateStr: string): string | null => {
  if (!dateStr) return null;
  // expects format "Quarta, 01 de Julho"
  const match = dateStr.match(/(\d{1,2}) de ([a-zA-Zá-úÁ-Ú]+)/i);
  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const monthName = match[2].toLowerCase();

  const months: { [key: string]: string } = {
    janeiro: "01",
    fevereiro: "02",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12",
  };

  const month = months[monthName];
  if (!month) return null;

  // To avoid predicting too far in the future which breaks free APIs,
  // we fetch empirical historical data from exactly 1 year prior.
  const year = "2025";
  return `${year}-${month}-${day}`;
};

const getWeatherDescription = (code: number) => {
  // WMO Weather interpretation codes
  if (code === 0)
    return { desc: "Céu limpo", icon: Sun, color: "text-amber-500" };
  if (code === 1 || code === 2 || code === 3)
    return {
      desc: "Parcialmente nublado",
      icon: Cloud,
      color: "text-slate-500",
    };
  if (code >= 45 && code <= 48)
    return { desc: "Nevoeiro", icon: Cloud, color: "text-slate-400" };
  if (code >= 51 && code <= 67)
    return { desc: "Chuva leve", icon: CloudRain, color: "text-blue-500" };
  if (code >= 71 && code <= 82)
    return {
      desc: "Chuva forte/Neve",
      icon: CloudRain,
      color: "text-indigo-600",
    };
  if (code >= 95)
    return { desc: "Tempestade", icon: AlertCircle, color: "text-purple-600" };
  return { desc: "Variável", icon: Cloud, color: "text-slate-500" };
};

export default function WeatherWidget({
  destination,
  activeDay,
}: WeatherWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      if (!destination || !activeDay) return;

      const targetDate = parseDateFromPortugueseStr(activeDay.dateStr);
      if (!targetDate) {
        setError("Formato de data inválido.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: Geocode destination city
        const geoQuery = encodeURIComponent(destination.city);
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${geoQuery}&count=1&language=pt&format=json`,
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error("Cidade não encontrada no mapa.");
        }

        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;

        // Step 2: Fetch historical/climate data for that exact day (we use archive API from 1y ago for empirical expected temps)
        const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${targetDate}&end_date=${targetDate}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=America%2FNew_York`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (
          weatherData.daily &&
          weatherData.daily.time &&
          weatherData.daily.time.length > 0
        ) {
          setData({
            tempMax: Math.round(weatherData.daily.temperature_2m_max[0]),
            tempMin: Math.round(weatherData.daily.temperature_2m_min[0]),
            weatherCode: weatherData.daily.weathercode[0],
            dateStr: activeDay.dateStr,
          });
        } else {
          throw new Error("Previsão não disponível.");
        }
      } catch (err: any) {
        console.error("OpenMeteo Erro:", err);
        setError(err.message || "Erro ao carregar clima");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [destination, activeDay]);

  if (!destination || !activeDay) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
      <div>
        <h4 className="text-xs font-black text-indigo-900 mb-0.5 flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-indigo-500" />
          Clima Esperado
        </h4>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {destination.city} • Dia do Passeio
        </p>
      </div>

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="text-xs text-indigo-400 font-medium animate-pulse">
            Carregando previsão...
          </div>
        ) : error ? (
          <div className="text-xs text-rose-500 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        ) : data ? (
          <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-xl border border-indigo-50 shadow-xs">
            {(() => {
              const info = getWeatherDescription(data.weatherCode);
              const IconComp = info.icon;
              return (
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-slate-50 ${info.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm">
                      <span>{data.tempMax}°</span>
                      <span className="text-slate-400 text-xs font-medium">
                        / {data.tempMin}°C
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {info.desc}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-xs text-slate-400">Nenhum dado</div>
        )}
      </div>
    </div>
  );
}
