import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

const binqApiUrl = String.fromEnvironment(
  'BINQ_API_URL',
  defaultValue: 'https://binq.io',
);
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
const mapboxAccessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

void main() {
  runApp(const BinqLivreurApp());
}

class BinqLivreurApp extends StatelessWidget {
  const BinqLivreurApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Binq Livreur',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF059669)),
        useMaterial3: true,
        fontFamily: '.SF Pro Text',
      ),
      home: const LivreurOnboardingGate(),
    );
  }
}

class LivreurOnboardingGate extends StatefulWidget {
  const LivreurOnboardingGate({super.key});

  @override
  State<LivreurOnboardingGate> createState() => _LivreurOnboardingGateState();
}

class _LivreurOnboardingGateState extends State<LivreurOnboardingGate> {
  bool onboardingCompleted = false;

  @override
  Widget build(BuildContext context) {
    if (onboardingCompleted) return const LivreurHomePage();
    return LivreurOnboardingPage(
      onCompleted: () => setState(() => onboardingCompleted = true),
    );
  }
}

class LivreurOnboardingPage extends StatefulWidget {
  const LivreurOnboardingPage({required this.onCompleted, super.key});

  final VoidCallback onCompleted;

  @override
  State<LivreurOnboardingPage> createState() => _LivreurOnboardingPageState();
}

class _LivreurOnboardingPageState extends State<LivreurOnboardingPage> {
  final PageController _pageController = PageController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _vehicleBrandController = TextEditingController();
  final TextEditingController _plateController = TextEditingController();
  final TextEditingController _withdrawPhoneController =
      TextEditingController();

  int step = 0;
  String vehicle = 'Moto';
  String mobileMoney = 'MTN MoMo';
  bool otpSent = false;
  bool otpVerified = false;
  bool profilePhotoAdded = false;
  bool idPhotoAdded = false;
  bool vehiclePhotoAdded = false;
  bool walletCreated = false;
  bool locationAuthorized = false;

  static const int totalSteps = 10;

  @override
  void dispose() {
    _pageController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _cityController.dispose();
    _vehicleBrandController.dispose();
    _plateController.dispose();
    _withdrawPhoneController.dispose();
    super.dispose();
  }

  Future<void> _next() async {
    if (!_isStepValid()) {
      await _showMessage(
        'Informations manquantes',
        'Complétez les éléments obligatoires avant de continuer.',
      );
      return;
    }

    if (step == totalSteps - 1) {
      await _submitApplication();
      return;
    }

    setState(() => step += 1);
    await _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  void _previous() {
    if (step == 0) return;
    setState(() => step -= 1);
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOutCubic,
    );
  }

  bool _isStepValid() {
    switch (step) {
      case 0:
        return true;
      case 1:
        return _phoneController.text.trim().length >= 8 && otpVerified;
      case 2:
        return _firstNameController.text.trim().isNotEmpty &&
            _lastNameController.text.trim().isNotEmpty &&
            _cityController.text.trim().isNotEmpty;
      case 3:
        return _vehicleBrandController.text.trim().isNotEmpty;
      case 4:
        return idPhotoAdded;
      case 5:
        return _withdrawPhoneController.text.trim().length >= 8;
      case 6:
        return walletCreated;
      case 7:
        return locationAuthorized;
      case 8:
        return true;
      case 9:
        return true;
      default:
        return false;
    }
  }

  Future<void> _submitApplication() async {
    await _showMessage(
      'Compte prêt 🎉',
      'Votre profil Binq Rider est activé. Passez en ligne pour recevoir vos premières commandes et viser le bonus de 2 000 FCFA.',
    );
    widget.onCompleted();
  }

  void _sendOtp() {
    if (_phoneController.text.trim().length < 8) {
      _showMessage(
          'Numéro invalide', 'Entrez un numéro WhatsApp ou mobile valide.');
      return;
    }
    setState(() {
      otpSent = true;
      _otpController.text = '1234';
    });
    _showMessage(
        'Code envoyé', 'Code démo : 1234. À connecter ensuite au SMS OTP.');
  }

  void _verifyOtp() {
    if (_otpController.text.trim().length < 4) {
      _showMessage('Code incomplet', 'Entrez le code reçu par SMS.');
      return;
    }
    setState(() => otpVerified = true);
  }

  Future<void> _createWallet() async {
    setState(() => walletCreated = true);
    await _showMessage('Wallet créé',
        'Wallet Binq créé automatiquement avec un solde de 0 FCFA.');
  }

  Future<void> _requestLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Activez la localisation du téléphone.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Autorisation GPS refusée.');
      }

      setState(() => locationAuthorized = true);
    } catch (error) {
      await _showMessage(
        'Localisation requise',
        error.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> _showMessage(String title, String message) {
    return showCupertinoDialog<void>(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title),
        content: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(message),
        ),
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = (step + 1) / totalSteps;

    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF0FDF4),
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: const Color(0xFF14852F),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          CupertinoIcons.bag_fill,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Binq Livreur',
                        style: TextStyle(
                          color: Color(0xFF14852F),
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -1.1,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${step + 1}/$totalSteps',
                        style: const TextStyle(
                          color: Color(0xFF047857),
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: const Color(0xFFD1FAE5),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFF14852F),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  const _OnboardingStep(
                    eyebrow: 'Binq Rider',
                    title: 'Gagnez de l’argent avec Binq Livraison',
                    text:
                        'Inscription ultra rapide. Téléphone, profil, moyen de paiement, localisation : objectif prêt à livrer en moins de 10 minutes.',
                    children: [
                      _BonusBanner(),
                      _RequirementTile(
                        icon: CupertinoIcons.money_dollar_circle_fill,
                        title: 'Commencez à gagner rapidement',
                        text:
                            'Recevez des commandes, livrez et suivez vos gains dans le wallet.',
                      ),
                      _RequirementTile(
                        icon: CupertinoIcons.timer_fill,
                        title: 'Moins de 10 minutes',
                        text:
                            'Pas de formulaire long. On demande seulement l’essentiel.',
                      ),
                      _RequirementTile(
                        icon: CupertinoIcons.location_solid,
                        title: 'Passez en ligne',
                        text:
                            'La localisation permet le dispatch, la heatmap et le tracking client.',
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: '1 min',
                    title: 'Votre numéro',
                    text:
                        'Le téléphone est votre identifiant principal. Pas d’email obligatoire.',
                    children: [
                      _InputField(
                        label: 'Numéro de téléphone',
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: CupertinoButton(
                              borderRadius: BorderRadius.circular(18),
                              color: const Color(0xFFD1FAE5),
                              onPressed: _sendOtp,
                              child: const Text(
                                'Recevoir le code',
                                style: TextStyle(
                                  color: Color(0xFF14852F),
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (otpSent)
                        _InputField(
                          label: 'Code OTP SMS',
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                        ),
                      if (otpSent)
                        CupertinoButton(
                          borderRadius: BorderRadius.circular(18),
                          color: otpVerified
                              ? const Color(0xFF14852F)
                              : const Color(0xFF064E3B),
                          onPressed: _verifyOtp,
                          child: Text(
                            otpVerified
                                ? 'Numéro vérifié ✓'
                                : 'Vérifier mon numéro',
                            style: const TextStyle(fontWeight: FontWeight.w900),
                          ),
                        ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: '3 min',
                    title: 'Profil rapide',
                    text: 'Seulement les informations utiles pour commencer.',
                    children: [
                      _InputField(
                        label: 'Prénom',
                        controller: _firstNameController,
                      ),
                      _InputField(
                        label: 'Nom',
                        controller: _lastNameController,
                      ),
                      _InputField(
                        label: 'Ville principale',
                        controller: _cityController,
                      ),
                      _PhotoUploadCard(
                        title: 'Photo profil',
                        text: profilePhotoAdded
                            ? 'Photo ajoutée'
                            : 'Optionnel mais recommandé',
                        icon: CupertinoIcons.person_crop_circle_fill,
                        done: profilePhotoAdded,
                        onTap: () => setState(() => profilePhotoAdded = true),
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: '5 min',
                    title: 'Votre véhicule',
                    text:
                        'Choisissez votre moyen de livraison. La plaque peut être ajoutée plus tard.',
                    children: [
                      const _SectionLabel('Véhicule'),
                      _ChoiceWrap(
                        values: const ['Moto', 'Vélo', 'Voiture'],
                        selected: vehicle,
                        onSelected: (value) => setState(() => vehicle = value),
                      ),
                      _InputField(
                        label: 'Marque / modèle',
                        controller: _vehicleBrandController,
                      ),
                      _InputField(
                        label: 'Plaque — optionnel au début',
                        controller: _plateController,
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Documents MVP',
                    title: 'Un minimum de documents',
                    text:
                        'Pour éviter l’abandon, Binq demande seulement l’essentiel au départ.',
                    children: [
                      _PhotoUploadCard(
                        title: 'Pièce d’identité',
                        text: idPhotoAdded ? 'Document ajouté' : 'Obligatoire',
                        icon: CupertinoIcons.doc_text_fill,
                        done: idPhotoAdded,
                        onTap: () => setState(() => idPhotoAdded = true),
                      ),
                      _PhotoUploadCard(
                        title: 'Photo du véhicule',
                        text: vehiclePhotoAdded
                            ? 'Photo ajoutée'
                            : 'Optionnel pour le MVP',
                        icon: CupertinoIcons.camera_fill,
                        done: vehiclePhotoAdded,
                        onTap: () => setState(() => vehiclePhotoAdded = true),
                      ),
                      const _RequirementTile(
                        icon: CupertinoIcons.checkmark_shield_fill,
                        title: 'Assurance / responsabilité',
                        text:
                            'Sera vérifiée progressivement selon les règles locales.',
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: '7 min',
                    title: 'Mobile Money',
                    text:
                        'Configurez le numéro où vous voulez retirer vos gains.',
                    children: [
                      const _SectionLabel('Réseau de retrait'),
                      _ChoiceWrap(
                        values: const ['MTN MoMo', 'Moov Money'],
                        selected: mobileMoney,
                        onSelected: (value) =>
                            setState(() => mobileMoney = value),
                      ),
                      _InputField(
                        label: 'Numéro de retrait',
                        controller: _withdrawPhoneController,
                        keyboardType: TextInputType.phone,
                      ),
                      const _RequirementTile(
                        icon: CupertinoIcons.bolt_fill,
                        title: 'Retrait rapide',
                        text:
                            'Cash-out instantané à connecter au backend paiement.',
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Wallet',
                    title: 'Wallet Binq',
                    text: 'Votre compte de gains est créé automatiquement.',
                    children: [
                      _WalletCreatedCard(created: walletCreated),
                      CupertinoButton(
                        borderRadius: BorderRadius.circular(18),
                        color: const Color(0xFF14852F),
                        onPressed: _createWallet,
                        child: Text(
                          walletCreated ? 'Wallet prêt ✓' : 'Créer mon wallet',
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Dispatch GPS',
                    title: 'Autoriser la localisation',
                    text:
                        'Obligatoire pour recevoir des commandes autour de vous.',
                    children: [
                      _RequirementTile(
                        icon: locationAuthorized
                            ? CupertinoIcons.checkmark_circle_fill
                            : CupertinoIcons.location_solid,
                        title: locationAuthorized
                            ? 'Localisation autorisée'
                            : 'Localisation requise',
                        text:
                            'Utilisée pour le dispatch, la heatmap et le tracking client.',
                      ),
                      CupertinoButton(
                        borderRadius: BorderRadius.circular(18),
                        color: const Color(0xFF14852F),
                        onPressed: _requestLocation,
                        child: Text(
                          locationAuthorized
                              ? 'GPS activé ✓'
                              : 'Autoriser la localisation',
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                  const _OnboardingStep(
                    eyebrow: 'Mini tutoriel',
                    title: 'Comment gagner avec Binq',
                    text: '3 choses à savoir avant de passer en ligne.',
                    children: [
                      _TutorialSlide(
                        number: '1',
                        title: 'Recevez des commandes',
                        text: 'Acceptez les courses proches de votre position.',
                      ),
                      _TutorialSlide(
                        number: '2',
                        title: 'Livrez rapidement',
                        text:
                            'Suivez l’itinéraire, récupérez et confirmez la livraison.',
                      ),
                      _TutorialSlide(
                        number: '3',
                        title: 'Retirez vos gains',
                        text:
                            'Votre wallet se crédite, puis vous retirez en Mobile Money.',
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Activation',
                    title: 'Votre compte est prêt 🎉',
                    text:
                        'Vous pouvez passer en ligne et commencer à recevoir des commandes.',
                    children: [
                      const _BonusBanner(),
                      _SummaryTile(
                          label: 'Téléphone', value: _phoneController.text),
                      _SummaryTile(label: 'Ville', value: _cityController.text),
                      _SummaryTile(label: 'Véhicule', value: vehicle),
                      _SummaryTile(
                          label: 'Wallet',
                          value: walletCreated ? '0 FCFA' : 'À créer'),
                      _SummaryTile(
                          label: 'Retrait',
                          value:
                              '$mobileMoney · ${_withdrawPhoneController.text}'),
                    ],
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
              child: Row(
                children: [
                  if (step > 0)
                    Expanded(
                      child: CupertinoButton(
                        borderRadius: BorderRadius.circular(18),
                        color: Colors.white,
                        onPressed: _previous,
                        child: const Text(
                          'Retour',
                          style: TextStyle(
                            color: Color(0xFF047857),
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  if (step > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: CupertinoButton(
                      borderRadius: BorderRadius.circular(18),
                      color: const Color(0xFF14852F),
                      onPressed: _next,
                      child: Text(
                        step == 0
                            ? 'Commencer'
                            : step == totalSteps - 1
                                ? 'Passer en ligne'
                                : 'Continuer',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingStep extends StatelessWidget {
  const _OnboardingStep({
    required this.eyebrow,
    required this.title,
    required this.text,
    required this.children,
  });

  final String eyebrow;
  final String title;
  final String text;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
      children: [
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: const Color(0xFFBBF7D0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eyebrow.toUpperCase(),
                style: const TextStyle(
                  color: Color(0xFF14852F),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF064E3B),
                  fontSize: 30,
                  height: 1.05,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1.1,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                text,
                style: const TextStyle(
                  color: Color(0xFF047857),
                  fontSize: 15,
                  height: 1.45,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ...children.expand((child) => [child, const SizedBox(height: 10)]),
      ],
    );
  }
}

class _RequirementTile extends StatelessWidget {
  const _RequirementTile({
    required this.icon,
    required this.title,
    required this.text,
  });

  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFD1FAE5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFD1FAE5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: const Color(0xFF14852F), size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF064E3B),
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  text,
                  style: const TextStyle(
                    color: Color(0xFF047857),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BonusBanner extends StatelessWidget {
  const _BonusBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFBBF24)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(CupertinoIcons.gift_fill, color: Color(0xFFD97706), size: 28),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bonus onboarding',
                  style: TextStyle(
                    color: Color(0xFF92400E),
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Faites 5 livraisons et gagnez +2 000 FCFA bonus.',
                  style: TextStyle(
                    color: Color(0xFF92400E),
                    fontSize: 13,
                    height: 1.35,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PhotoUploadCard extends StatelessWidget {
  const _PhotoUploadCard({
    required this.title,
    required this.text,
    required this.icon,
    required this.done,
    required this.onTap,
  });

  final String title;
  final String text;
  final IconData icon;
  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: done ? const Color(0xFFD1FAE5) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: done ? const Color(0xFF14852F) : const Color(0xFFBBF7D0),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: done ? const Color(0xFF14852F) : const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                done ? CupertinoIcons.checkmark_alt : icon,
                color: done ? Colors.white : const Color(0xFF14852F),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF064E3B),
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    text,
                    style: const TextStyle(
                      color: Color(0xFF047857),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(CupertinoIcons.camera, color: Color(0xFF14852F)),
          ],
        ),
      ),
    );
  }
}

class _WalletCreatedCard extends StatelessWidget {
  const _WalletCreatedCard({required this.created});

  final bool created;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF064E3B),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                created
                    ? CupertinoIcons.checkmark_circle_fill
                    : CupertinoIcons.money_dollar_circle_fill,
                color: const Color(0xFF86EFAC),
              ),
              const SizedBox(width: 8),
              Text(
                created ? 'Wallet créé automatiquement' : 'Wallet prêt à créer',
                style: const TextStyle(
                  color: Color(0xFF86EFAC),
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            '0 FCFA',
            style: TextStyle(
              color: Colors.white,
              fontSize: 42,
              fontWeight: FontWeight.w900,
              letterSpacing: -1.4,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Solde initial. Chaque livraison validée crédite votre wallet Binq.',
            style: TextStyle(color: Color(0xFFD1FAE5), height: 1.4),
          ),
        ],
      ),
    );
  }
}

class _TutorialSlide extends StatelessWidget {
  const _TutorialSlide({
    required this.number,
    required this.title,
    required this.text,
  });

  final String number;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFF14852F),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF064E3B),
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  text,
                  style: const TextStyle(
                    color: Color(0xFF047857),
                    fontSize: 13,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.label,
    required this.controller,
    this.keyboardType,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionLabel(label),
        const SizedBox(height: 6),
        CupertinoTextField(
          controller: controller,
          keyboardType: keyboardType,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFBBF7D0)),
          ),
          style: const TextStyle(
            color: Color(0xFF064E3B),
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF064E3B),
        fontSize: 13,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _ChoiceWrap extends StatelessWidget {
  const _ChoiceWrap({
    required this.values,
    required this.selected,
    required this.onSelected,
  });

  final List<String> values;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: values.map((value) {
        final active = selected == value;
        return GestureDetector(
          onTap: () => onSelected(value),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 11),
            decoration: BoxDecoration(
              color: active ? const Color(0xFF14852F) : Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color:
                    active ? const Color(0xFF14852F) : const Color(0xFFBBF7D0),
              ),
            ),
            child: Text(
              value,
              style: TextStyle(
                color: active ? Colors.white : const Color(0xFF047857),
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD1FAE5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF047857),
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value.isEmpty ? '—' : value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Color(0xFF064E3B),
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LivreurHomePage extends StatefulWidget {
  const LivreurHomePage({super.key});

  @override
  State<LivreurHomePage> createState() => _LivreurHomePageState();
}

class _LivreurHomePageState extends State<LivreurHomePage> {
  String trackingStatus = 'Suivi livreur inactif';
  bool tracking = false;

  Future<void> startTracking() async {
    setState(() => tracking = true);
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw Exception('Activez la localisation iOS.');

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Autorisation GPS refusée.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
        ),
      );
      setState(() {
        trackingStatus =
            'Livreur localisé · ${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
      });
    } catch (error) {
      setState(
        () => trackingStatus = error.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      setState(() => tracking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF0FDF4),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _HeroCard(),
            const SizedBox(height: 16),
            _ActionCard(
              status: trackingStatus,
              loading: tracking,
              onPressed: tracking ? null : startTracking,
            ),
            const SizedBox(height: 16),
            const _MapPreview(),
            const SizedBox(height: 16),
            const _FeatureTile(
              title: 'Livraisons assignées',
              text:
                  'Les commandes où livreur_id correspond au compte connecté.',
            ),
            const SizedBox(height: 10),
            const _FeatureTile(
              title: 'Position client',
              text: 'Point client Mapbox fourni par le checkout obligatoire.',
            ),
            const SizedBox(height: 10),
            const _FeatureTile(
              title: 'Wallet livreur',
              text: 'Montant livraison crédité après paiement confirmé.',
            ),
            const SizedBox(height: 16),
            const Text(
              'Backend: $binqApiUrl',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF047857),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF064E3B),
        borderRadius: BorderRadius.circular(32),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Binq Livreur iOS',
            style: TextStyle(
              color: Color(0xFF86EFAC),
              fontWeight: FontWeight.w900,
              letterSpacing: 1.4,
              fontSize: 12,
            ),
          ),
          SizedBox(height: 10),
          Text(
            'Vos livraisons.\nLa position client.\nL’itinéraire.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 31,
              height: 1.08,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 10),
          Text(
            'Application Flutter dédiée aux livreurs assignés par les commerçants Binq.',
            style: TextStyle(
              color: Color(0xFFD1FAE5),
              fontSize: 15,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.status,
    required this.loading,
    required this.onPressed,
  });

  final String status;
  final bool loading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Statut GPS livreur',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Color(0xFF064E3B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            status,
            style: const TextStyle(
              fontSize: 14,
              height: 1.45,
              color: Color(0xFF047857),
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: CupertinoButton(
              borderRadius: BorderRadius.circular(18),
              color: const Color(0xFF059669),
              onPressed: onPressed,
              child: Text(
                loading ? 'Localisation...' : 'Activer mon suivi livreur',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapPreview extends StatelessWidget {
  const _MapPreview();

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 190),
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF86EFAC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Carte Mapbox native',
            style: TextStyle(
              color: Color(0xFF064E3B),
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            mapboxAccessToken.isEmpty
                ? 'Ajoutez MAPBOX_ACCESS_TOKEN avec --dart-define.'
                : 'Token Mapbox détecté.',
            style: const TextStyle(
              color: Color(0xFF047857),
              fontSize: 13,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'À connecter ensuite aux coordonnées delivery_latitude / delivery_longitude.',
            style: TextStyle(
              color: Color(0xFF047857),
              fontSize: 13,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.title, required this.text});
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF064E3B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              height: 1.45,
              color: Color(0xFF047857),
            ),
          ),
        ],
      ),
    );
  }
}
