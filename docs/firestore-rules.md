# Firestore Security Rules Configuratie

De foutmelding "Missing or insufficient permissions" betekent dat de standaard veiligheidsregels van uw Firebase database de toegang voor de webapplicatie blokkeren.

Volg deze stappen om dit (voor ontwikkelingsdoeleinden) op te lossen:

1.  **Ga naar uw Firebase project:** Open de [Firebase Console](https://console.firebase.google.com/) en selecteer uw project (`onlinelabs-harvest`).

2.  **Open Firestore:** Klik in het linkermenu onder 'Bouwen' op **Firestore Database**.

3.  **Ga naar de 'Regels' tab:** Bovenaan de Firestore pagina ziet u een aantal tabs. Klik op **Regels**.

4.  **Vervang de bestaande regels:** U ziet een editor met de huidige regels. Verwijder alles wat daar staat en vervang het door de onderstaande code:

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // WAARSCHUWING: Deze regels zijn alleen voor ontwikkelingsdoeleinden.
        // Ze staan iedereen toe om uw database te lezen en te schrijven.
        // Beveilig uw data met specifiekere regels voor productie.
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```

5.  **Publiceer de regels:** Klik op de **Publiceren** knop boven de editor.

6.  **Herlaad de applicatie:** Vernieuw de webpagina van de applicatie. De foutmelding zou nu verdwenen moeten zijn en de data zou correct moeten laden.

**Belangrijk:** Deze regels zijn onveilig voor een productie-omgeving. Zodra de applicatie verder ontwikkeld is, moeten deze vervangen worden door regels die alleen ingelogde gebruikers toegang geven tot hun eigen data.
