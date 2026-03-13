'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface AppointmentConsentFormProps {
    isOpen: boolean;
    appointmentId: string;
    appointmentType: 'telemedicine' | 'in_person';
    onSubmit: (data: { recordingConsent: boolean }) => Promise<void>;
    onCancel: () => void;
}

export function AppointmentConsentForm({
    isOpen,
    appointmentId,
    appointmentType,
    onSubmit,
    onCancel,
}: AppointmentConsentFormProps) {
    const [recordingConsent, setRecordingConsent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await onSubmit({ recordingConsent });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record consent');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Appointment Consent</DialogTitle>
                    <DialogDescription>
                        Bestätigen Sie Ihre Zustimmung zur Datenverarbeitung
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* General data processing consent */}
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Checkbox
                            id="data-processing"
                            defaultChecked={true}
                            disabled
                            className="mt-1"
                        />
                        <Label htmlFor="data-processing" className="flex-1 cursor-pointer">
                            <span className="font-medium text-sm">
                                Ich akzeptiere die Datenverarbeitung für diese Sitzung
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-1">
                                I accept data processing for this appointment session
                            </span>
                        </Label>
                    </div>

                    {/* Recording consent (telemedicine only) */}
                    {appointmentType === 'telemedicine' && (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <Checkbox
                                id="recording-consent"
                                checked={recordingConsent}
                                onCheckedChange={setRecordingConsent}
                                className="mt-1"
                            />
                            <Label htmlFor="recording-consent" className="flex-1 cursor-pointer">
                                <span className="font-medium text-sm">
                                    Ich akzeptiere eine Audio- und Videoaufzeichnung
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400 block mt-1">
                                    I consent to audio and video recording (optional)
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-500 block mt-2">
                                    Die Aufzeichnung wird nach 90 Tagen automatisch gelöscht, falls nicht anders
                                    vereinbart.
                                    <br />
                                    Recordings are automatically deleted after 90 days unless otherwise agreed.
                                </span>
                            </Label>
                        </div>
                    )}

                    {/* Legal basis information */}
                    <div className="text-xs text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-900/50 rounded">
                        <p className="font-medium mb-1">Rechtsgrundlage / Legal Basis</p>
                        <p>
                            Artikel 6(1)(a) DSGVO (Einwilligung) / Article 6(1)(a) GDPR (Consent)
                            <br />
                            Artikel 9(2)(h) DSGVO (Medizinische Zwecke) / Article 9(2)(h) GDPR (Medical
                            purposes)
                        </p>
                    </div>

                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel / Abbrechen
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Confirm / Bestätigen'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
