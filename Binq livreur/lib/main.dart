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
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _experienceController = TextEditingController();
  final TextEditingController _bankController = TextEditingController();

  int step = 0;
  String vehicle = 'Moto';
  String availability = 'Temps partiel';
  bool hasId = false;
  bool hasLicense = false;
  bool hasInsurance = false;
  bool hasSmartphone = true;
  bool acceptsIndependentTerms = false;

  static const int totalSteps = 5;

  @override
  void dispose() {
    _pageController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _cityController.dispose();
    _experienceController.dispose();
    _bankController.dispose();
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
        return _firstNameController.text.trim().isNotEmpty &&
            _lastNameController.text.trim().isNotEmpty &&
            _phoneController.text.trim().isNotEmpty &&
            _emailController.text.trim().contains('@') &&
            _cityController.text.trim().isNotEmpty;
      case 2:
        return hasSmartphone && (vehicle != 'Voiture' || hasLicense);
      case 3:
        return hasId && hasInsurance;
      case 4:
        return acceptsIndependentTerms;
      default:
        return false;
    }
  }

  Future<void> _submitApplication() async {
    await _showMessage(
      'Candidature envoyée',
      'Votre dossier livreur indépendant est prêt pour vérification. Binq pourra ensuite valider vos documents, votre zone et vos créneaux.',
    );
    widget.onCompleted();
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
                    eyebrow: 'Recrutement indépendant',
                    title: 'Devenez livreur indépendant Binq',
                    text:
                        'Inscrivez-vous, indiquez votre zone, vos créneaux et les documents nécessaires. Binq vérifie ensuite votre profil avant activation.',
                    children: [
                      _RequirementTile(
                        icon: CupertinoIcons.location_solid,
                        title: 'Choisir votre zone',
                        text:
                            'Définissez les villes et quartiers où vous pouvez livrer.',
                      ),
                      _RequirementTile(
                        icon: CupertinoIcons.doc_text_fill,
                        title: 'Préparer vos documents',
                        text:
                            'Pièce d’identité, permis si nécessaire et assurance.',
                      ),
                      _RequirementTile(
                        icon: CupertinoIcons.money_dollar_circle_fill,
                        title: 'Être payé après livraison',
                        text:
                            'Votre wallet livreur est crédité après les commandes validées.',
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Profil candidat',
                    title: 'Vos informations',
                    text:
                        'Ces informations permettent à Binq de vérifier et contacter le livreur indépendant.',
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
                        label: 'Téléphone WhatsApp',
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                      ),
                      _InputField(
                        label: 'Email',
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      _InputField(
                        label: 'Ville principale',
                        controller: _cityController,
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Mode de livraison',
                    title: 'Véhicule et disponibilité',
                    text:
                        'Binq doit savoir comment vous livrez et quand vous êtes disponible.',
                    children: [
                      const _SectionLabel('Véhicule'),
                      _ChoiceWrap(
                        values: const ['Vélo', 'Moto', 'Voiture', 'À pied'],
                        selected: vehicle,
                        onSelected: (value) => setState(() => vehicle = value),
                      ),
                      const SizedBox(height: 12),
                      const _SectionLabel('Disponibilité'),
                      _ChoiceWrap(
                        values: const [
                          'Temps partiel',
                          'Temps plein',
                          'Soirs',
                          'Week-end',
                        ],
                        selected: availability,
                        onSelected: (value) =>
                            setState(() => availability = value),
                      ),
                      const SizedBox(height: 12),
                      _SwitchTile(
                        title: 'Smartphone avec internet',
                        text:
                            'Obligatoire pour GPS, appels et statuts de livraison.',
                        value: hasSmartphone,
                        onChanged: (value) =>
                            setState(() => hasSmartphone = value),
                      ),
                      _SwitchTile(
                        title: 'Permis disponible',
                        text: 'Obligatoire pour voiture, recommandé pour moto.',
                        value: hasLicense,
                        onChanged: (value) =>
                            setState(() => hasLicense = value),
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Vérification',
                    title: 'Documents à contrôler',
                    text:
                        'À connecter ensuite à l’upload Supabase pour recevoir les documents réels.',
                    children: [
                      _SwitchTile(
                        title: 'Pièce d’identité valide',
                        text:
                            'Carte nationale, passeport ou document officiel.',
                        value: hasId,
                        onChanged: (value) => setState(() => hasId = value),
                      ),
                      _SwitchTile(
                        title: 'Assurance / responsabilité',
                        text:
                            'Confirmation nécessaire pour protéger les courses.',
                        value: hasInsurance,
                        onChanged: (value) =>
                            setState(() => hasInsurance = value),
                      ),
                      _InputField(
                        label: 'Expérience de livraison ou quartier connu',
                        controller: _experienceController,
                        maxLines: 3,
                      ),
                      _InputField(
                        label: 'Compte de paiement / Mobile Money',
                        controller: _bankController,
                      ),
                    ],
                  ),
                  _OnboardingStep(
                    eyebrow: 'Validation finale',
                    title: 'Résumé du dossier',
                    text:
                        'Vérifiez votre candidature avant envoi à l’équipe Binq.',
                    children: [
                      _SummaryTile(
                        label: 'Nom',
                        value:
                            '${_firstNameController.text} ${_lastNameController.text}'
                                .trim(),
                      ),
                      _SummaryTile(
                        label: 'Contact',
                        value: _phoneController.text,
                      ),
                      _SummaryTile(label: 'Ville', value: _cityController.text),
                      _SummaryTile(label: 'Véhicule', value: vehicle),
                      _SummaryTile(label: 'Disponibilité', value: availability),
                      _SwitchTile(
                        title: 'Statut indépendant accepté',
                        text:
                            'Je comprends que je candidate comme livreur indépendant, sous réserve de validation Binq.',
                        value: acceptsIndependentTerms,
                        onChanged: (value) =>
                            setState(() => acceptsIndependentTerms = value),
                      ),
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
                        step == totalSteps - 1
                            ? 'Envoyer ma candidature'
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

class _InputField extends StatelessWidget {
  const _InputField({
    required this.label,
    required this.controller,
    this.keyboardType,
    this.maxLines = 1,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final int maxLines;

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
          maxLines: maxLines,
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
                color: active
                    ? const Color(0xFF14852F)
                    : const Color(0xFFBBF7D0),
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

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    required this.title,
    required this.text,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String text;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF064E3B),
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  text,
                  style: const TextStyle(
                    color: Color(0xFF047857),
                    fontSize: 12.5,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          CupertinoSwitch(
            value: value,
            activeTrackColor: const Color(0xFF14852F),
            onChanged: onChanged,
          ),
        ],
      ),
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
