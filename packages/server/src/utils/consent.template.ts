export const consentVersion = {
    version: '1.0',
    effectiveDate: new Date().toISOString(),
    title: 'Data Processing Agreement and Patient Consent v1.0',
    content: `
# DATENSCHUTZERKLÄRUNG UND PATIENTENEINWILLIGUNG
## Data Protection Declaration and Patient Consent

### 1. Zweck der Datenverarbeitung / Purpose of Data Processing

Ihre medizinischen Daten werden verarbeitet zum Zweck der medizinischen Behandlung, 
Diagnose, und Verwaltung von Terminen im Rahmen von Telemedizin und persönlichen Besuchen.

Your medical data is processed for the purpose of medical treatment, diagnosis, and 
appointment management in the context of telemedicine and in-person visits.

### 2. Rechtsgrundlage / Legal Basis

Die Verarbeitung erfolgt auf Basis von:
- Artikel 6 Absatz 1 Buchstabe a DSGVO (Einwilligung/Consent)
- Artikel 9 Absatz 2 Buchstabe h DSGVO (Medizinische Zwecke/Medical purposes)
- Telemedizingesetz (TMG § 7)

Processing is based on:
- Article 6(1)(a) GDPR (Consent)
- Article 9(2)(h) GDPR (Medical purposes)
- Telemedizingesetz (TMG § 7)

### 3. Verarbeiter / Processors

Verantwortlicher: [Your Company Name], [Address]
Data Controller: [Your Company Name], [Address]

Datenschutzbeauftragter / Data Protection Officer: dpo@yourcompany.de

### 4. Ihre Rechte / Your Rights

Sie haben das Recht:
- Auf Auskunft über Ihre Daten (Artikel 15 DSGVO)
- Auf Berichtigung unrichtig er Daten (Artikel 16 DSGVO)
- Auf Löschung Ihrer Daten (Artikel 17 DSGVO)
- Auf Datenportabilität (Artikel 20 DSGVO)
- Auf Widerspruch gegen die Verarbeitung (Artikel 21 DSGVO)

You have the right to:
- Access your data (Article 15 GDPR)
- Rectification of inaccurate data (Article 16 GDPR)
- Erasure of your data (Article 17 GDPR)
- Data portability (Article 20 GDPR)
- Object to processing (Article 21 GDPR)

### 5. Sicherheit / Security

Ihre Daten werden durch folgende Maßnahmen geschützt:
- AES-256 Verschlüsselung in Ruhe
- TLS 1.3 Verschlüsselung bei der Übertragung
- Zugriffskontrolle und Rollenverwaltung
- Regelmäßige Sicherheitsaudits
- Unveränderbare Audit-Logs

Your data is protected by:
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- Access control and role management
- Regular security audits
- Immutable audit logs

### 6. Datenspeicherung / Data Retention

Medizinische Daten werden gemäß Bundesmeldeverordnung (BMV) für mindestens 10 Jahre 
nach der letzten Behandlung aufbewahrt, danach gelöscht.

Medical data is retained in accordance with Federal Record Regulation (BMV) for at 
least 10 years after the final treatment, then deleted.

### 7. Beschwerde / Complaints

Im Falle von Datenschutzverletzungen können Sie sich an die zuständige 
Datenschutzbehörde wenden:

In case of data protection violations, you can file a complaint with the competent 
data protection authority:

[State Data Protection Authority Contact Information]

### 8. Zustimmung / Consent

Mit Unterzeichnung dieser Erklärung bestätige ich:
☑ Ich lese und verstehe diese Erklärung
☑ Ich akzeptiere die Verarbeitung meiner Daten gemäß dieser Erklärung
☑ Ich bestätige, dass ich über die Nutzung meiner Daten informiert bin

By signing this declaration, I confirm:
☑ I have read and understood this declaration
☑ I accept the processing of my data according to this declaration
☑ I confirm that I am informed about the use of my data

Datum / Date: _______________
Unterschrift / Signature: _______________
  `,
};
