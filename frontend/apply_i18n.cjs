const fs = require('fs');
const path = 'D:\\Suraksha - Web App\\frontend\\src\\pages\\UserManagementPage.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('useTranslation')) {
  content = content.replace('import { useDialog }', "import { useTranslation } from 'react-i18next'\nimport { useDialog }");
}

content = content.replace(/export default function UserManagementPage\(\)/g, "export default function UserManagementPage() {\n  const { t } = useTranslation()\n").replace('UserManagementPage() {\n\n  const', 'UserManagementPage() {\n  const');
content = content.replace(/function RBACMatrixTab\(\{ showToast \}: any\) \{/g, "function RBACMatrixTab({ showToast }: any) {\n  const { t } = useTranslation()");
content = content.replace(/function AuditLogsTab\(\) \{/g, "function AuditLogsTab() {\n  const { t } = useTranslation()");
content = content.replace(/function SecurityTab\(\{ showToast \}: any\) \{/g, "function SecurityTab({ showToast }: any) {\n  const { t } = useTranslation()");
content = content.replace(/function UserProfileModal\(\{ user, currentUserId, onClose, onRoleChange, onSendLink, onToggleApp \}: any\) \{/g, "function UserProfileModal({ user, currentUserId, onClose, onRoleChange, onSendLink, onToggleApp }: any) {\n  const { t } = useTranslation()");
content = content.replace(/function BulkImportModal\(\{ onClose, onSuccess, showToast \}: any\) \{/g, "function BulkImportModal({ onClose, onSuccess, showToast }: any) {\n  const { t } = useTranslation()");
content = content.replace(/function OnboardSpecialistModal\(\{ onClose, onSuccess, showToast \}: any\) \{/g, "function OnboardSpecialistModal({ onClose, onSuccess, showToast }: any) {\n  const { t } = useTranslation()");

const reps = [
  ['"User Management | Suraksha"', '`${t(\'nav.user_management\')} | Suraksha`'],
  ['pageTitle="User Management"', 'pageTitle={t(\'nav.user_management\')}'],
  ['">Bulk Import (CSV)<"', '">{t(\'user_management_page.bulk_import\')}<"'],
  ['">Onboard Specialist<"', '">{t(\'user_management_page.onboard_specialist\')}<"'],
  ['label: \'Total Base\'', 'label: t(\'user_management_page.total_base\')'],
  ['label: \'DMC Personnel\'', 'label: t(\'user_management_page.dmc_personnel\')'],
  ['label: \'Field Responders\'', 'label: t(\'user_management_page.field_responders\')'],
  ['label: \'Administrators\'', 'label: t(\'user_management_page.administrators\')'],
  ['label: \'Directory\'', 'label: t(\'user_management_page.tabs.directory\')'],
  ['label: \'RBAC Matrix\'', 'label: t(\'user_management_page.tabs.rbac\')'],
  ['label: \'Audit Logs\'', 'label: t(\'user_management_page.tabs.audit\')'],
  ['label: \'2FA & Security\'', 'label: t(\'user_management_page.tabs.security\')'],
  ['>Authority Level<', '>{t(\'user_management_page.authority_level\')}<'],
  ['<option>All Roles</option>', '<option>{t(\'user_management_page.all_roles\')}</option>'],
  ['>Citizen<', '>{t(\'user_management_page.citizen\')}<'],
  ['>Volunteer<', '>{t(\'user_management_page.volunteer\')}<'],
  ['>Field Responder<', '>{t(\'user_management_page.field_responder\')}<'],
  ['>DMC Officer<', '>{t(\'user_management_page.dmc_officer\')}<'],
  ['>Admin<', '>{t(\'user_management_page.admin\')}<'],
  ['>System Admin<', '>{t(\'user_management_page.admin\')}<'],
  ['>Database Identity Search<', '>{t(\'user_management_page.search_placeholder\')}<'],
  ['placeholder="Search by identity name or secure email..."', 'placeholder={t(\'user_management_page.search_hint\')}'],
  ['>Identity<', '>{t(\'user_management_page.identity\')}<'],
  ['>Comms Node<', '>{t(\'user_management_page.comms_node\')}<'],
  ['>Authority<', '>{t(\'user_management_page.authority\')}<'],
  ['>Field App<', '>{t(\'user_management_page.field_app\')}<'],
  ['>Actions<', '>{t(\'user_management_page.actions\')}<'],
  ['>Decrypting Personnel Archives...<', '>{t(\'user_management_page.loading\')}<'],
  ['>Zero Matching Profiles<', '>{t(\'user_management_page.no_profiles\')}<'],
  ['\'Installed\' : \'Missing\'', 't(\'user_management_page.installed\') : t(\'user_management_page.missing_app\')'],
  ['>Send Link<', '>{t(\'user_management_page.send_link\')}<'],
  ['title="View Profile"', 'title={t(\'user_management_page.view_profile\')}'],
  ['title="Revoke Access"', 'title={t(\'user_management_page.revoke_access\')}'],
  ['>Role-Based Access Control (RBAC)<', '>{t(\'user_management_page.rbac_title\')}<'],
  ['>Define granular permissions across all operational modules.<', '>{t(\'user_management_page.rbac_desc\')}<'],
  ['>Save Policy Matrix<', '>{t(\'user_management_page.save_policy\')}<'],
  ['>Role / Module<', '>{t(\'user_management_page.role_module\')}<'],
  ['>View<', '>{t(\'user_management_page.view\')}<'],
  ['>Edit<', '>{t(\'user_management_page.edit\')}<'],
  ['>Del<', '>{t(\'user_management_page.del\')}<'],
  ['Recent Session Logins', '{t(\'user_management_page.recent_logins\')}'],
  ['System Activity Audit', '{t(\'user_management_page.system_audit\')}'],
  ['IP:', '{t(\'user_management_page.ip\')}'],
  ['Device:', '{t(\'user_management_page.device\')}'],
  ['>2FA Security Enforcement<', '>{t(\'user_management_page.two_fa_title\')}<'],
  ['>Protect personnel accounts with mandatory Two-Factor Authentication.<', '>{t(\'user_management_page.two_fa_desc\')}<'],
  ['>Setup Authenticator App<', '>{t(\'user_management_page.setup_authenticator\')}<'],
  ['>Enable 2FA (TOTP)<', '>{t(\'user_management_page.enable_2fa\')}<'],
  ['>Or enter secret manually:<', '>{t(\'user_management_page.enter_secret\')}<'],
  ['>Verify<', '>{t(\'user_management_page.verify\')}<'],
  ['\'Installed\' : \'Not installed\'', 't(\'user_management_page.profile_installed\') : t(\'user_management_page.profile_not_installed\')'],
  ['\'Installed\' : \'Mark Installed\'', 't(\'user_management_page.profile_installed\') : t(\'user_management_page.mark_installed\')'],
  ['>Change Authority Level<', '>{t(\'user_management_page.change_authority\')}<'],
  ['>Two-Factor Auth<', '>{t(\'user_management_page.two_factor_auth\')}<'],
  ['\'Enabled\' : \'Disabled\'', 't(\'user_management_page.enabled\') : t(\'user_management_page.disabled\')'],
  ['Joined ', '{t(\'user_management_page.joined\')} '],
  ['Last active ', '{t(\'user_management_page.last_active\')} '],
  ['\'No phone number\'', 't(\'user_management_page.no_phone\')'],
  ['>Bulk Personnel Onboarding<', '>{t(\'user_management_page.bulk_title\')}<'],
  ['>CSV Identity Matrix Import<', '>{t(\'user_management_page.csv_import\')}<'],
  ['>Upload CSV file (Name, Email, NIC, Phone, Role)<', '>{t(\'user_management_page.upload_csv\')}<'],
  ['>Discard<', '>{t(\'user_management_page.discard\')}<'],
  ['\'Processing...\' : \'Commit Import\'', 't(\'user_management_page.processing\') : t(\'user_management_page.commit_import\')'],
  ['>Credentials Enlistment<', '>{t(\'user_management_page.credentials_enlistment\')}<'],
  ['>Register Specialist Node<', '>{t(\'user_management_page.register_specialist\')}<'],
  ['>Full Identity Name<', '>{t(\'user_management_page.full_identity\')}<'],
  ['>Email<', '>{t(\'user_management_page.email\')}<'],
  ['>Password<', '>{t(\'user_management_page.password\')}<'],
  ['>Role<', '>{t(\'user_management_page.role\')}<'],
  ['>Phone<', '>{t(\'user_management_page.phone\')}<'],
  ['>Field Volunteer<', '>{t(\'user_management_page.field_volunteer\')}<'],
  ['>Standard Citizen<', '>{t(\'user_management_page.standard_citizen\')}<'],
  ['\'Transmitting...\' : \'Finalize Onboarding\'', 't(\'user_management_page.transmitting\') : t(\'user_management_page.finalize_onboarding\')']
];

for (const [s, r] of reps) {
  content = content.split(s).join(r);
}

content = content.replace('>Bulk Import (CSV)<', '>{t(\'user_management_page.bulk_import\')}<');
content = content.replace('>Onboard Specialist<', '>{t(\'user_management_page.onboard_specialist\')}<');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
