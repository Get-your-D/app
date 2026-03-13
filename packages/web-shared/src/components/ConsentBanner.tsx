'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface ConsentBannerProps {
    onAccept?: () => void;
    onReject?: () => void;
    isDismissible?: boolean;
}

export function ConsentBanner({ onAccept, onReject, isDismissible = true }: ConsentBannerProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    const handleAccept = () => {
        localStorage.setItem('gdpr_consent', 'accepted');
        setIsVisible(false);
        onAccept?.();
    };

    const handleReject = () => {
        localStorage.setItem('gdpr_consent', 'rejected');
        setIsVisible(false);
        onReject?.();
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 border-t border-slate-700">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-2">Datenschutz / Data Protection</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            Ihre Daten werden gemäß GDPR und deutscher Datenschutzbestimmungen verarbeitet.
                            Weitere Informationen finden Sie in unserer{' '}
                            <a href="/privacy" className="underline text-blue-400 hover:text-blue-300">
                                Datenschutzerklärung
                            </a>
                            .
                            <br />
                            Your data is processed according to GDPR and German data protection regulations.
                            For more information, see our{' '}
                            <a href="/privacy" className="underline text-blue-400 hover:text-blue-300">
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            onClick={handleAccept}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                        >
                            Accept / Akzeptieren
                        </Button>
                        <Button
                            onClick={handleReject}
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-800"
                            size="sm"
                        >
                            Decline / Ablehnen
                        </Button>

                        {isDismissible && (
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 hover:bg-slate-800 rounded"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
