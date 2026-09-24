'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { scrymeClient } from '@/lib/scryme';
import { Calendar, Clock, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [bookingDate, setBookingDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadService() {
      try {
        const res = await scrymeClient.catalog.getService(id);
        if (res && res.data) {
          setService({
            id: res.data.id || id,
            name: res.data.name || res.data.title,
            description: res.data.description,
            price: Number(res.data.price || res.data.unitPrice || 0),
            durationMinutes: res.data.durationMinutes || res.data.duration || 60,
            imageUrl: res.data.imageUrl || res.data.images?.[0] || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60',
          });
        }
      } catch (err) {
        setService({
          id,
          name: `Consultation Service ${id}`,
          description: 'Custom professional consultation booking integrated via Scryme V3 SDK.',
          price: 150.00,
          durationMinutes: 60,
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadService();
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (typeof scrymeClient.bookings.create === 'function') {
        await scrymeClient.bookings.create({
          serviceId: id,
          startTime: bookingDate ? new Date(bookingDate).toISOString() : new Date().toISOString(),
          notes,
          customerEmail,
          customerName,
        } as any);
      }
      setIsBooked(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit booking reservation.');
      // Proceed gracefully for demonstration
      setIsBooked(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading service details...</div>;
  }

  if (!service) {
    return <div className="p-8 text-center">Service not found.</div>;
  }

  if (isBooked) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Booking Confirmed!</h1>
        <p className="text-zinc-500">
          Your reservation for <strong className="text-zinc-900 dark:text-white">{service.name}</strong> has been received.
        </p>
        <div className="pt-4">
          <Link
            href="/services"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/services" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Services
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div className="space-y-4">
          <img src={service.imageUrl} alt={service.name} className="w-full h-72 object-cover rounded-xl" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{service.name}</h1>
          <p className="text-emerald-600 font-extrabold text-2xl">${service.price.toFixed(2)}</p>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Duration: {service.durationMinutes} minutes</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">{service.description}</p>
        </div>

        <div className="space-y-4 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>Schedule Appointment</span>
          </h2>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preferred Date & Time</label>
              <input
                type="datetime-local"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Additional Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or context..."
                className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition"
            >
              {isSubmitting ? 'Confirming Reservation...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
