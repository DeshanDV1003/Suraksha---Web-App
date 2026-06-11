const { Project, SyntaxKind } = require('ts-morph');

const project = new Project();

const pages = [
  'DashboardPage.tsx',
  'MapPage.tsx',
  'IncidentsPage.tsx',
  'AlertsPage.tsx',
  'ReportsPage.tsx',
  'UserManagementPage.tsx',
  'ResourcesPage.tsx',
  'CampsPage.tsx',
  'TokensPage.tsx',
  'SettingsPage.tsx',
  'VolunteerPage.tsx',
  'HelpRequestsPage.tsx',
  'DamageAssessmentPage.tsx',
  'MissingPersonsPage.tsx',
  'SupportPage.tsx',
  'DonationsPage.tsx',
  'FamilySafetyPage.tsx'
];

pages.forEach(page => {
  const filePath = `../src/pages/${page}`;
  
  try {
    const sourceFile = project.addSourceFileAtPath(filePath);
    
    // Check if already added
    const imports = sourceFile.getImportDeclarations();
    if (imports.some(i => i.getModuleSpecifierValue().includes('PageBreadcrumb'))) {
      console.log(`Skipping ${page} - already has Breadcrumb`);
      return;
    }

    // Add imports
    sourceFile.addImportDeclarations([
      { defaultImport: 'PageBreadcrumb', moduleSpecifier: '@/components/common/PageBreadcrumb' },
      { defaultImport: 'PageMeta', moduleSpecifier: '@/components/common/PageMeta' }
    ]);

    // Format Title
    let title = page.replace('Page.tsx', '').replace('.tsx', '');
    title = title.replace(/([A-Z])/g, ' $1').trim();
    if (title === 'Map') title = 'Live Map';
    if (title === 'Dashboard') title = 'Dashboard';

    // Find default export function
    const defaultExport = sourceFile.getDefaultExportSymbol()?.getValueDeclaration();
    if (!defaultExport || !defaultExport.isKind(SyntaxKind.FunctionDeclaration)) {
      console.log(`Skipping ${page} - no default export function found`);
      return;
    }

    // Find the return statement inside the function
    const returnStatements = defaultExport.getDescendantsOfKind(SyntaxKind.ReturnStatement);
    if (returnStatements.length === 0) {
      console.log(`Skipping ${page} - no return statement found`);
      return;
    }

    // Usually the main return is the last one in the function body, or the first one that returns JSX
    // We want the one that returns the top-level JSX element (ParenthesizedExpression or JsxElement)
    let mainReturn = returnStatements.find(r => {
      const expr = r.getExpression();
      return expr && (expr.isKind(SyntaxKind.ParenthesizedExpression) || expr.isKind(SyntaxKind.JsxElement) || expr.isKind(SyntaxKind.JsxFragment));
    });

    if (!mainReturn) {
      console.log(`Skipping ${page} - no main JSX return found`);
      return;
    }

    const expression = mainReturn.getExpression();
    let originalJsx = '';
    
    if (expression.isKind(SyntaxKind.ParenthesizedExpression)) {
       originalJsx = expression.getExpression().getText();
    } else {
       originalJsx = expression.getText();
    }

    // Now remove the old redundant <h1> header from the original JSX
    // This is a simple string replacement because AST replacement of JSX is complex
    let modifiedJsx = originalJsx;
    
    // Remove the header div pattern
    // Usually it looks like: <div className="flex items-center justify-between">\n <div>\n <h1 ...>...</h1>\n <p>...</p>\n </div>\n ...
    // We will just remove any <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white/90">...</h1>
    // Actually, just leaving it is fine, but removing is better.
    // Let's use a regex to strip out the h1 and its sibling p if they exist at the top.
    
    modifiedJsx = modifiedJsx.replace(/<div className="flex items-center justify-between">\s*<div>\s*<h1[^>]*>.*?<\/h1>\s*(<p[^>]*>.*?<\/p>)?\s*<\/div>/g, '<div className="flex items-center justify-between">');
    // For Dashboard which has slightly different header:
    modifiedJsx = modifiedJsx.replace(/<h1 className="text-3xl font-bold[^>]*>.*?<\/h1>/g, '');
    modifiedJsx = modifiedJsx.replace(/<p className="text-gray-500[^>]*>.*?<\/p>/g, '');

    const newJsx = `(
      <>
        <PageMeta title="${title} | Suraksha" description="Suraksha ${title} Page" />
        <PageBreadcrumb pageTitle="${title}" />
        ${modifiedJsx}
      </>
    )`;

    if (expression.isKind(SyntaxKind.ParenthesizedExpression)) {
        expression.replaceWithText(newJsx);
    } else {
        expression.replaceWithText(newJsx);
    }

    sourceFile.saveSync();
    console.log(`Updated ${page}`);
  } catch (err) {
    console.error(`Error processing ${page}:`, err);
  }
});

console.log('Breadcrumb migration complete.');
