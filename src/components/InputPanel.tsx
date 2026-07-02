import React, { useState, useContext, useCallback } from 'react';
import { AppContext } from '@/app/context/AppContext';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useFormValidation } from '@/hooks/useFormValidation';
import { websiteFormSchema } from '@/shared/validation';
import { COLOR_PALETTES } from '@/shared/constants';
import { ValidatedField } from '@/components/ValidatedField';
import { CheckIcon, MicrophoneIcon, SparklesIcon } from '@/components/IconSet';

export const InputPanel: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Loading Context...</h1>
                <p>AppContext is not available yet</p>
            </div>
        );
    }
    
    const { 
        t, userName, setUserName, businessName, setBusinessName, userEmail, setUserEmail, 
        userPhone, setUserPhone, prompt, setPrompt, selectedPalette, setSelectedPalette,
        handleGenerate, language, error, services, setServices, location, setLocation,
        themeColor, setThemeColor
    } = context;

    const formValues = {
        userName,
        businessName,
        userEmail,
        userPhone,
        prompt,
        services,
        location,
        themeColor,
        selectedPalette,
    };

    const {
        errors,
        markTouched,
        validateAll,
        isFieldValid,
        isFormValid,
    } = useFormValidation({ schema: websiteFormSchema, values: formValues, t });

    const { isListening, error: speechError, toggleListening } = useSpeechToText({ onTranscript: setPrompt, lang: language });
    const [unlockedSections, setUnlockedSections] = useState({ 
        details: false, 
        description: false, 
        services: false, 
        style: false 
    });

    const detailsComplete = !errors.userName && !errors.businessName && !errors.userEmail && !errors.userPhone
        && userName.trim() !== '' && businessName.trim() !== '' && userEmail.trim() !== '' && userPhone.trim() !== '';
    const descriptionComplete = !errors.prompt && prompt.trim() !== '';
    const servicesComplete = !errors.services && services.trim() !== '';
    
    React.useEffect(() => {
        setUnlockedSections({
            details: detailsComplete,
            description: detailsComplete,
            services: detailsComplete && descriptionComplete,
            style: detailsComplete && descriptionComplete && servicesComplete,
        });
    }, [detailsComplete, descriptionComplete, servicesComplete]);

    const canGenerate = isFormValid;

    const onSubmit = useCallback(() => {
        const result = validateAll();
        if (result.success === false) return;
        handleGenerate();
    }, [validateAll, handleGenerate]);

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in-up">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800">{t('headline1')}</h2>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{t('subheadline')}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
                {/* Step 1: Business Details */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                        {t('formStep1Title')}
                        {detailsComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                    </h3>
                    <p className="text-gray-500 mb-6">{t('step1Subtitle')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ValidatedField
                            label={t('yourNamePlaceholder')}
                            error={errors.userName}
                            isValid={isFieldValid('userName')}
                            showSuccess
                        >
                            {(fieldProps) => (
                                <input
                                    {...fieldProps}
                                    type="text"
                                    value={userName}
                                    onChange={(e) => {
                                        setUserName(e.target.value);
                                        markTouched('userName');
                                    }}
                                    onBlur={() => markTouched('userName')}
                                    placeholder={t('yourNamePlaceholder')}
                                />
                            )}
                        </ValidatedField>
                        <ValidatedField
                            label={t('businessNamePlaceholder')}
                            error={errors.businessName}
                            isValid={isFieldValid('businessName')}
                            showSuccess
                        >
                            {(fieldProps) => (
                                <input
                                    {...fieldProps}
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => {
                                        setBusinessName(e.target.value);
                                        markTouched('businessName');
                                    }}
                                    onBlur={() => markTouched('businessName')}
                                    placeholder={t('businessNamePlaceholder')}
                                />
                            )}
                        </ValidatedField>
                        <ValidatedField
                            label={t('emailPlaceholder')}
                            error={errors.userEmail}
                            isValid={isFieldValid('userEmail')}
                            showSuccess
                        >
                            {(fieldProps) => (
                                <input
                                    {...fieldProps}
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => {
                                        setUserEmail(e.target.value);
                                        markTouched('userEmail');
                                    }}
                                    onBlur={() => markTouched('userEmail')}
                                    placeholder={t('emailPlaceholder')}
                                    autoComplete="email"
                                />
                            )}
                        </ValidatedField>
                        <ValidatedField
                            label={t('phonePlaceholder')}
                            error={errors.userPhone}
                            isValid={isFieldValid('userPhone')}
                            showSuccess
                        >
                            {(fieldProps) => (
                                <input
                                    {...fieldProps}
                                    type="tel"
                                    value={userPhone}
                                    onChange={(e) => {
                                        setUserPhone(e.target.value);
                                        markTouched('userPhone');
                                    }}
                                    onBlur={() => markTouched('userPhone')}
                                    placeholder={t('phonePlaceholder')}
                                    autoComplete="tel"
                                />
                            )}
                        </ValidatedField>
                    </div>
                </div>

                {/* Step 2: Business Description */}
                {unlockedSections.description && (
                    <div className="mb-8 animate-fade-in-up-short">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                            {t('step2Title')}
                            {descriptionComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                        </h3>
                        <p className="text-gray-500 mb-6">{t('step2Subtitle')}</p>
                        <ValidatedField
                            error={errors.prompt}
                            isValid={isFieldValid('prompt')}
                            showSuccess
                        >
                            {(fieldProps) => (
                                <div className="relative">
                                    <textarea
                                        {...fieldProps}
                                        value={prompt}
                                        onChange={(e) => {
                                            setPrompt(e.target.value);
                                            markTouched('prompt');
                                        }}
                                        onBlur={() => markTouched('prompt')}
                                        className={`${fieldProps.className} h-36 p-4 pr-16 text-lg resize-y`}
                                        placeholder={t('placeholder')}
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                                            isListening
                                                ? 'bg-red-500 text-white animate-pulse'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                        aria-label={isListening ? t('stopListening') : t('startListening')}
                                    >
                                        <MicrophoneIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </ValidatedField>
                        {speechError && <p className="text-red-500 mt-2">{speechError}</p>}
                    </div>
                )}

                {/* Step 3: Services */}
                {unlockedSections.services && (
                    <div className="mb-8 animate-fade-in-up-short">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                            Services & Products
                            {servicesComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                        </h3>
                        <p className="text-gray-500 mb-6">Describe what your business offers</p>
                        <ValidatedField
                            error={errors.services}
                            isValid={isFieldValid('services')}
                            showSuccess
                        >
                            {(fieldProps) => (
                                <textarea
                                    {...fieldProps}
                                    value={services}
                                    onChange={(e) => {
                                        setServices(e.target.value);
                                        markTouched('services');
                                    }}
                                    onBlur={() => markTouched('services')}
                                    className={`${fieldProps.className} h-32 p-4 text-lg resize-y`}
                                    placeholder="e.g., Web design, digital marketing, consulting, coffee and pastries..."
                                />
                            )}
                        </ValidatedField>
                    </div>
                )}

                {/* Step 4: Location & Theme */}
                {unlockedSections.style && (
                    <div className="animate-fade-in-up-short">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">Location & Style</h3>
                        <p className="text-gray-500 mb-6">Set your location and choose a style</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <ValidatedField
                                label="Business Location"
                                error={errors.location}
                                isValid={isFieldValid('location')}
                                showSuccess={Boolean(location.trim())}
                            >
                                {(fieldProps) => (
                                    <input
                                        {...fieldProps}
                                        type="text"
                                        value={location}
                                        onChange={(e) => {
                                            setLocation(e.target.value);
                                            markTouched('location');
                                        }}
                                        onBlur={() => markTouched('location')}
                                        placeholder="City, State or Country"
                                    />
                                )}
                            </ValidatedField>
                            
                            <ValidatedField
                                label="Theme Color"
                                error={errors.themeColor}
                                isValid={isFieldValid('themeColor')}
                                showSuccess
                            >
                                {(fieldProps) => (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={themeColor}
                                            onChange={(e) => {
                                                setThemeColor(e.target.value);
                                                markTouched('themeColor');
                                            }}
                                            onBlur={() => markTouched('themeColor')}
                                            className="w-16 h-12 border border-gray-200 rounded cursor-pointer"
                                            aria-label="Theme color picker"
                                        />
                                        <input
                                            {...fieldProps}
                                            type="text"
                                            value={themeColor}
                                            onChange={(e) => {
                                                setThemeColor(e.target.value);
                                                markTouched('themeColor');
                                            }}
                                            onBlur={() => markTouched('themeColor')}
                                            placeholder="#10b981"
                                            className={`${fieldProps.className} flex-1`}
                                        />
                                    </div>
                                )}
                            </ValidatedField>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Color Palette</label>
                            {errors.selectedPalette && (
                                <p className="text-red-600 text-sm mb-2" role="alert" aria-live="polite">
                                    {errors.selectedPalette}
                                </p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="radiogroup" aria-label="Color Palette">
                                {COLOR_PALETTES.map(p => (
                                    <button 
                                        key={p.name}
                                        type="button"
                                        role="radio"
                                        aria-checked={selectedPalette === p.name}
                                        onClick={() => {
                                            setSelectedPalette(p.name);
                                            markTouched('selectedPalette');
                                        }} 
                                        className={`p-4 rounded-lg border-4 transition ${
                                            selectedPalette === p.name ? 'border-lime-500 scale-105' : 'border-gray-200 hover:border-lime-300'
                                        }`}
                                    >
                                        <div className="flex -space-x-2 justify-center mb-2">
                                            {Object.values(p.palette).map((color, i) => (
                                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${color}`}></div>
                                            ))}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{t(p.name)}</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {error && <p className="text-red-500 mt-6 text-center font-medium" role="alert">{error}</p>}

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <button 
                                type="button"
                                onClick={onSubmit} 
                                disabled={!canGenerate} 
                                className="bg-lime-500 text-white font-bold py-4 px-16 text-lg rounded-lg hover:bg-lime-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
                            >
                                <SparklesIcon className="w-6 h-6" /> {t('generateButton')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
