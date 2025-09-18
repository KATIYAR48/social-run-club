'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/Button';
import Loader from '@/components/ui/PixelLoader';

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    createdAt: string;
    exactLocation?: string;
    postApprovalMessage?: string;
    postRejectionMessage?: string;
    razorpayButtonId?: string;
    bannerImageURL?: string;
    autoApprove?: boolean;
    additionalInfoField?: {
        label: string;
        required: boolean;
        fieldType: 'text' | 'number' | 'select';
        options?: string[];
    };
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{
        show: boolean;
        eventId: string;
        title: string;
        action: 'delete';
    }>({
        show: false,
        eventId: '',
        title: '',
        action: 'delete'
    });
    const [eventForm, setEventForm] = useState<{
        show: boolean;
        isEdit: boolean;
        event: Partial<Event>;
    }>({
        show: false,
        isEdit: false,
        event: {
            title: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            location: '',
            exactLocation: '',
            postApprovalMessage: '',
            postRejectionMessage: '',
            razorpayButtonId: '',
            bannerImageURL: '',
            autoApprove: false,
            additionalInfoField: {
                label: '',
                required: false,
                fieldType: 'text',
                options: []
            }
        }
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/events');

            if (response.status === 401) {
                // Redirect to login if unauthorized
                router.push('/auth?redirect=/admin/events');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }

            const data = await response.json();
            // Extract the events array from the response
            setEvents(data.events || []);
        } catch (error) {
            setError('Failed to load events. Please try again.');
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
            // No timeZone option, so it uses the user's local time
        });
    };

    const openConfirmDialog = (eventId: string, title: string, action: 'delete') => {
        setConfirmDialog({
            show: true,
            eventId,
            title,
            action
        });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({
            show: false,
            eventId: '',
            title: '',
            action: 'delete'
        });
    };

    const confirmAction = async () => {
        const { eventId, action } = confirmDialog;
        if (action === 'delete') {
            await handleDelete(eventId);
        }
        closeConfirmDialog();
    };

    const handleDelete = async (eventId: string) => {
        setIsDeleting(eventId);
        setDeleteError('');

        try {
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                // Remove the deleted event from the state
                setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
            } else {
                setDeleteError(data.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            setDeleteError('An error occurred while deleting the event');
        } finally {
            setIsDeleting(null);
        }
    };

    // Helper to convert UTC date string to local datetime-local string
    function toDatetimeLocal(dateString: string) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    }

    const openEventForm = (isEdit: boolean, event?: Event) => {
        setEventForm({
            show: true,
            isEdit,
            event: isEdit && event ? {
                ...event,
                date: toDatetimeLocal(event.date),
                autoApprove: event.autoApprove || false,
                additionalInfoField: event.additionalInfoField || {
                    label: '',
                    required: false,
                    fieldType: 'text',
                    options: []
                }
            } : {
                title: '',
                description: '',
                date: toDatetimeLocal(new Date().toISOString()),
                location: '',
                exactLocation: '',
                postApprovalMessage: '',
                postRejectionMessage: '',
                razorpayButtonId: '',
                bannerImageURL: '',
                autoApprove: false,
                additionalInfoField: {
                    label: '',
                    required: false,
                    fieldType: 'text',
                    options: []
                }
            }
        });
        setFormError('');
    };

    const closeEventForm = () => {
        setEventForm({
            show: false,
            isEdit: false,
            event: {
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                location: '',
                exactLocation: '',
                postApprovalMessage: '',
                postRejectionMessage: '',
                razorpayButtonId: '',
                bannerImageURL: '',
                autoApprove: false,
                additionalInfoField: {
                    label: '',
                    required: false,
                    fieldType: 'text',
                    options: []
                }
            }
        });
        setFormError('');
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setEventForm(prev => ({
            ...prev,
            event: {
                ...prev.event,
                [name]: type === 'checkbox' ? checked : value
            }
        }));

        // Clear form error when user types
        if (formError) {
            setFormError('');
        }
    };

    const handleAdditionalInfoChange = (field: string, value: string | boolean | string[]) => {
        setEventForm(prev => ({
            ...prev,
            event: {
                ...prev.event,
                additionalInfoField: {
                    ...prev.event.additionalInfoField!,
                    [field]: value
                }
            }
        }));

        // Clear form error when user types
        if (formError) {
            setFormError('');
        }
    };

    const addOption = () => {
        const newOption = prompt('Enter new option:');
        if (newOption && newOption.trim()) {
            handleAdditionalInfoChange('options', [
                ...(eventForm.event.additionalInfoField?.options || []),
                newOption.trim()
            ]);
        }
    };

    const removeOption = (index: number) => {
        handleAdditionalInfoChange('options',
            eventForm.event.additionalInfoField?.options?.filter((_, i) => i !== index) || []
        );
    };

    // Validate if a URL is a Google Maps link
    const isValidGoogleMapsLink = (url: string): boolean => {
        if (!url) return true; // Empty is valid (not required)

        // Check if it's a URL
        try {
            new URL(url);
        } catch {
            return false;
        }

        // Check if it's a Google Maps URL
        return url.includes('maps.google.com') ||
            url.includes('goo.gl/maps') ||
            url.includes('maps.app.goo.gl');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');

        const { isEdit, event } = eventForm;

        // Validate form
        if (!event.title || !event.description || !event.date || !event.location) {
            setFormError('Please fill in all required fields');
            setIsSubmitting(false);
            return;
        }

        // Validate Google Maps link if provided
        if (event.exactLocation && !isValidGoogleMapsLink(event.exactLocation)) {
            setFormError('Please enter a valid Google Maps link for the exact location');
            setIsSubmitting(false);
            return;
        }

        try {
            const url = isEdit ? `/api/admin/events/${event._id}` : '/api/admin/events';
            const method = isEdit ? 'PUT' : 'POST';

            // Convert local datetime-local string to UTC ISO string before sending
            const eventToSend = { ...event };
            if (event.date) {
                eventToSend.date = new Date(event.date).toISOString();
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventToSend),
            });

            const data = await response.json();

            if (response.ok) {
                if (isEdit) {
                    // Update the edited event in the state
                    setEvents(prevEvents =>
                        prevEvents.map(e =>
                            e._id === event._id ? data.event : e
                        )
                    );
                } else {
                    // Add the new event to the state
                    setEvents(prevEvents => [...prevEvents, data.event]);
                }
                closeEventForm();
            } else {
                setFormError(data.message || `Failed to ${isEdit ? 'update' : 'create'} event`);
            }
        } catch (error) {
            console.error(`Error ${eventForm.isEdit ? 'updating' : 'creating'} event:`, error);
            setFormError(`An error occurred while ${eventForm.isEdit ? 'updating' : 'creating'} the event`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-white dark:bg-black rounded-lg shadow-md mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl md:text-5xl font-bold text-black dark:text-white">Manage Events</h2>
                        <Button
                            onClick={() => openEventForm(false)}
                            className="px-4 py-2 bg-black text-white text-right underline rounded-md hover:bg-zinc-900 transition-colors"
                        >
                            Add New Event
                        </Button>
                    </div>

                    {error && (
                        <div className="bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white p-4 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    {deleteError && (
                        <div className="bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white p-4 rounded-md mb-4">
                            {deleteError}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8 text-black dark:text-white">
                            <Loader text={'Loading events...'} />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-black dark:text-white">
                            No events found. Click &quot;Add New Event&quot; to create one.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event) => (
                                <div key={event._id} className="bg-white dark:bg-black rounded-lg overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-800">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-xl font-bold text-black dark:text-white">{event.title}</h3>
                                            {event.autoApprove && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-zinc-800 dark:bg-zinc-900 dark:text-green-200">
                                                    OpenForAll
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-black dark:text-white mb-2">
                                            <span className="font-semibold">Date:</span> {formatDate(event.date)}
                                        </p>
                                        <p className="text-black dark:text-white mb-2">
                                            <span className="font-semibold">Location:</span> {event.location}
                                        </p>
                                        <p className="text-black dark:text-white mb-4 line-clamp-3">
                                            {event.description}
                                        </p>
                                        <div className="flex justify-between">
                                            <Button
                                                onClick={() => openEventForm(true, event)}
                                                className="px-3 py-1 bg-black text-white border border-black rounded hover:bg-zinc-900 transition-colors"
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => openConfirmDialog(event._id, event.title, 'delete')}
                                                disabled={isDeleting === event._id}
                                                className="border border-zinc-700 bg-zinc-800 text-white px-3 py-1 rounded hover:bg-black hover:text-white hover:border-zinc-700 transition-colors"

                                            >
                                                {isDeleting === confirmDialog.eventId ? 'Deleting...' : 'Delete'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Confirmation Dialog */}
            {confirmDialog.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-xl font-bold mb-4 text-black dark:text-white">
                            Delete Event
                        </h3>
                        <p className="mb-6 text-black dark:text-white">
                            Are you sure you want to delete the event <span className="font-semibold">{confirmDialog.title}</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                onClick={closeConfirmDialog}
                                className="px-4 py-2 bg-white dark:bg-black text-black dark:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-black dark:border-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmAction}
                                className="px-4 py-2 bg-black hover:bg-zinc-900 text-white rounded transition-colors"
                            >
                                {isDeleting === confirmDialog.eventId ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Form Dialog */}
            {eventForm.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-black rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-xl font-bold mb-4 text-black dark:text-white">
                            {eventForm.isEdit ? 'Edit Event' : 'Add New Event'}
                        </h3>

                        {formError && (
                            <div className="bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white p-4 rounded-md mb-4">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Title *
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={eventForm.event.title}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="date" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Date *
                                </label>
                                <div className="relative">
                                    <input
                                        id="date"
                                        name="date"
                                        type="datetime-local"
                                        value={eventForm.event.date}
                                        onChange={handleFormChange}
                                        className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white [color-scheme:light] cursor-pointer"
                                        required
                                        onClick={(e) => {
                                            // This ensures the datetime picker opens when clicking anywhere on the input
                                            const input = e.currentTarget;
                                            input.showPicker();
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="location" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Location * (General Area)
                                </label>
                                <input
                                    id="location"
                                    name="location"
                                    type="text"
                                    value={eventForm.event.location}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                    required
                                    placeholder="e.g. Downtown Miami"
                                />
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    Enter a general location that will be publicly visible
                                </p>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={eventForm.event.description}
                                    onChange={handleFormChange}
                                    rows={4}
                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="exactLocation" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Exact Location (Google Maps Link)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="exactLocation"
                                        name="exactLocation"
                                        type="text"
                                        value={eventForm.event.exactLocation || ''}
                                        onChange={handleFormChange}
                                        className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                        placeholder="https://maps.app.goo.gl/..."
                                    />
                                    <a
                                        href="https://www.google.com/maps"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 bg-black text-white rounded hover:bg-zinc-900 transition-colors flex items-center"
                                        title="Open Google Maps to get a location link"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    Paste a Google Maps link for the exact event location.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="postApprovalMessage" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Post-Approval Message
                                </label>
                                <textarea
                                    id="postApprovalMessage"
                                    name="postApprovalMessage"
                                    value={eventForm.event.postApprovalMessage || ''}
                                    onChange={handleFormChange}
                                    rows={4}
                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                    placeholder="Enter a message that will be shown to approved participants"
                                />
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    This message will be displayed to users after their registration is approved.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="postRejectionMessage" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Post-Rejection Message
                                </label>
                                <textarea
                                    id="postRejectionMessage"
                                    name="postRejectionMessage"
                                    value={eventForm.event.postRejectionMessage || ''}
                                    onChange={handleFormChange}
                                    rows={4}
                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                    placeholder="Enter a message that will be shown to rejected participants"
                                />
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    This message will be displayed to users after their registration is rejected.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="bannerImageURL" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Banner Image URL
                                </label>
                                <input
                                    id="bannerImageURL"
                                    name="bannerImageURL"
                                    type="url"
                                    value={eventForm.event.bannerImageURL || ''}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                    placeholder="Enter the URL for the event banner image"
                                />
                                <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    Optional: Add a URL for the event banner image. Use a direct image URL (e.g., .jpg, .png).
                                </p>

                                {eventForm.event.bannerImageURL && <img src={eventForm.event.bannerImageURL} alt="Banner Image" className="rounded-xl w-full h-auto" />}
                            </div>

                            <div>
                                <label htmlFor="razorpayButtonId" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                    Razorpay Button ID
                                </label>
                                <input
                                    id="razorpayButtonId"
                                    name="razorpayButtonId"
                                    type="text"
                                    value={eventForm.event.razorpayButtonId || ''}
                                    onChange={handleFormChange}
                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                    placeholder="Enter the Razorpay payment button ID"
                                />
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    Optional: Add a Razorpay payment button ID for this event.
                                </p>
                            </div>

                            {/* Auto-Approval Configuration */}
                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
                                <h4 className="text-lg font-semibold mb-4 text-black dark:text-white">
                                    Registration Approval Settings
                                </h4>
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="autoApprove"
                                        name="autoApprove"
                                        type="checkbox"
                                        checked={eventForm.event.autoApprove || false}
                                        onChange={handleFormChange}
                                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                    />
                                    <label htmlFor="autoApprove" className="text-sm text-black dark:text-white">
                                        Auto-approve all registrations
                                    </label>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    When enabled, all user registrations for this event will be automatically approved without requiring admin review.
                                </p>
                            </div>

                            {/* Additional Info Field Configuration */}
                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
                                <h4 className="text-lg font-semibold mb-4 text-black dark:text-white">
                                    Additional Registration Info (Optional)
                                </h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                    Configure an additional field to collect extra information from participants during registration.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="additionalInfoLabel" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                            Field Label
                                        </label>
                                        <input
                                            id="additionalInfoLabel"
                                            type="text"
                                            value={eventForm.event.additionalInfoField?.label || ''}
                                            onChange={(e) => handleAdditionalInfoChange('label', e.target.value)}
                                            className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                            placeholder="e.g. Height, Distance preference, T-shirt size"
                                        />
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                            Leave empty to disable additional info collection
                                        </p>
                                    </div>

                                    {eventForm.event.additionalInfoField?.label && (
                                        <>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    id="additionalInfoRequired"
                                                    type="checkbox"
                                                    checked={eventForm.event.additionalInfoField?.required || false}
                                                    onChange={(e) => handleAdditionalInfoChange('required', e.target.checked)}
                                                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                                />
                                                <label htmlFor="additionalInfoRequired" className="text-sm text-black dark:text-white">
                                                    Required field
                                                </label>
                                            </div>

                                            <div>
                                                <label htmlFor="additionalInfoType" className="block text-sm font-medium mb-1 text-black dark:text-white">
                                                    Field Type
                                                </label>
                                                <select
                                                    id="additionalInfoType"
                                                    value={eventForm.event.additionalInfoField?.fieldType || 'text'}
                                                    onChange={(e) => handleAdditionalInfoChange('fieldType', e.target.value as 'text' | 'number' | 'select')}
                                                    className="w-full p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="select">Select (Dropdown)</option>
                                                </select>
                                            </div>

                                            {eventForm.event.additionalInfoField?.fieldType === 'select' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                                                        Options
                                                    </label>
                                                    <div className="space-y-2">
                                                        {eventForm.event.additionalInfoField?.options?.map((option, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...(eventForm.event.additionalInfoField?.options || [])];
                                                                        newOptions[index] = e.target.value;
                                                                        handleAdditionalInfoChange('options', newOptions);
                                                                    }}
                                                                    className="flex-1 p-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white"
                                                                    placeholder="Option text"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOption(index)}
                                                                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={addOption}
                                                            className="px-3 py-2 bg-black text-white rounded hover:bg-zinc-900 transition-colors"
                                                        >
                                                            Add Option
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={closeEventForm}
                                    className="px-4 py-2 bg-white dark:bg-black text-black dark:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-black dark:border-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-white dark:bg-black text-black dark:text-white rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-black dark:border-white"
                                >
                                    {isSubmitting ? 'Saving...' : eventForm.isEdit ? 'Update Event' : 'Create Event'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 