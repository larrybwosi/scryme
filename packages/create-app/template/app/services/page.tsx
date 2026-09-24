'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { scrymeClient } from '@/lib/scryme';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number;
  imageUrl?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await scrymeClient.catalog.getServices();
        if (res && res.data) {
          const formatted = (res.data as any[]).map((s) => ({
            id: s.id || s._id,
            name: s.name || s.title,
            description: s.description,
            price: Number(s.price || s.unitPrice || 0),
            durationMinutes: s.durationMinutes || s.duration || 60,
            imageUrl: s.imageUrl || s.images?.[0] || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60',
          }));
          setServices(formatted);
        }
      } catch (err) {
        console.warn('Falling back to sample services:', err);
        setServices([
          {
            id: 'service-1',
            name: 'Strategy & Architecture Consultation',
            description: '1-on-1 technical advisory session with senior solutions architect.',
            price: 150.00,
            durationMinutes: 60,
            imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60',
          },
          {
            id: 'service-2',
            name: 'E-Commerce Setup & Onboarding',
            description: 'Hands-on configuration and integration of your Scryme catalog.',
            price: 299.00,
            durationMinutes: 120,
            imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    loadServices();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-8 sm:p-12 shadow-xl">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight flex items-center gap-3">
          <Calendar className="w-8 h-8 sm:w-12 sm:h-12" />
          <span>Bookable Services</span>
        </h1>
        <p className="mt-4 text-lg text-emerald-100 max-w-2xl">
          Schedule consultations, appointments, and technical services directly powered by Scryme V3 SDK.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Available Services</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <img src={service.imageUrl} alt={service.name} className="w-full h-48 object-cover" />
                  <div className="p-5 space-y-2">
                    <h3 className="font-semibold text-xl text-zinc-900 dark:text-white">{service.name}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">{service.description || 'No details provided.'}</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 pt-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{service.durationMinutes} minutes duration</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xl font-bold text-zinc-900 dark:text-white">
                    ${service.price.toFixed(2)}
                  </span>
                  <Link
                    href={`/services/${service.id}`}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <span>Book Service</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
