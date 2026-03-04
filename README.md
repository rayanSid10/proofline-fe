# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


```
proofline-fe
 ┣ .claude
 ┃ ┗ settings.local.json
 ┣ .github
 ┃ ┗ agents
 ┃ ┃ ┗ FrontendEngineer.agent.md
 ┣ docs
 ┃ ┣ 0001111.csv
 ┃ ┣ 0020022.csv
 ┃ ┣ FTDH_MASTER_IMPLEMENTATION_GUIDE.md
 ┃ ┣ FTDH_VALIDATED_PLAN.md
 ┃ ┣ POC_FTDH.docx
 ┃ ┣ POC_FTDH.md
 ┃ ┣ POC_IBMB.docx
 ┃ ┣ POC_IBMB.md
 ┃ ┣ poc-ftdh.md
 ┃ ┣ poc_ftdh.txt
 ┃ ┣ repo_structure.md
 ┃ ┣ requirements_ftdh.md
 ┃ ┗ requirements_ibmb.md
 ┣ public
 ┃ ┣ sample_activity_log.txt
 ┃ ┣ sample_ibmb_case_import.csv
 ┃ ┗ vite.svg
 ┣ src
 ┃ ┣ api
 ┃ ┃ ┗ axios.js
 ┃ ┣ assets
 ┃ ┃ ┗ react.svg
 ┃ ┣ components
 ┃ ┃ ┣ forms
 ┃ ┃ ┃ ┗ ManualTransactionModal.jsx
 ┃ ┃ ┣ layout
 ┃ ┃ ┃ ┣ Header.jsx
 ┃ ┃ ┃ ┣ MainLayout.jsx
 ┃ ┃ ┃ ┗ Sidebar.jsx
 ┃ ┃ ┣ modals
 ┃ ┃ ┃ ┣ FTDHCaseCreationModal.jsx
 ┃ ┃ ┃ ┣ FTDHCaseUpdateModal.jsx
 ┃ ┃ ┃ ┣ FTDHNoRecordDialog.jsx
 ┃ ┃ ┃ ┣ FTDHOutwardModals.jsx
 ┃ ┃ ┃ ┣ FTDHOutwardReportModal.jsx
 ┃ ┃ ┃ ┣ FTDHReportModal.jsx
 ┃ ┃ ┃ ┣ ImportModal.jsx
 ┃ ┃ ┃ ┣ InvestigationModal.jsx
 ┃ ┃ ┃ ┣ MultipleAccountsDialog.jsx
 ┃ ┃ ┃ ┣ NoRecordFoundDialog.jsx
 ┃ ┃ ┃ ┣ SingleAccountDialog.jsx
 ┃ ┃ ┃ ┣ SubmissionProgressBar.jsx
 ┃ ┃ ┃ ┗ SubmissionSuccessDialog.jsx
 ┃ ┃ ┣ panels
 ┃ ┃ ┃ ┗ TranscriptionPanel.jsx
 ┃ ┃ ┣ shared
 ┃ ┃ ┃ ┣ DataMasker.jsx
 ┃ ┃ ┃ ┗ StatusBadge.jsx
 ┃ ┃ ┗ ui
 ┃ ┃ ┃ ┣ alert.jsx
 ┃ ┃ ┃ ┣ avatar.jsx
 ┃ ┃ ┃ ┣ badge.jsx
 ┃ ┃ ┃ ┣ button.jsx
 ┃ ┃ ┃ ┣ card.jsx
 ┃ ┃ ┃ ┣ checkbox.jsx
 ┃ ┃ ┃ ┣ dialog.jsx
 ┃ ┃ ┃ ┣ dropdown-menu.jsx
 ┃ ┃ ┃ ┣ form.jsx
 ┃ ┃ ┃ ┣ input.jsx
 ┃ ┃ ┃ ┣ label.jsx
 ┃ ┃ ┃ ┣ radio-group.jsx
 ┃ ┃ ┃ ┣ select.jsx
 ┃ ┃ ┃ ┣ separator.jsx
 ┃ ┃ ┃ ┣ sheet.jsx
 ┃ ┃ ┃ ┣ skeleton.jsx
 ┃ ┃ ┃ ┣ sonner.jsx
 ┃ ┃ ┃ ┣ table.jsx
 ┃ ┃ ┃ ┣ tabs.jsx
 ┃ ┃ ┃ ┗ textarea.jsx
 ┃ ┣ context
 ┃ ┣ data
 ┃ ┃ ┣ caseStorage.js
 ┃ ┃ ┣ constants.js
 ┃ ┃ ┣ mockCases.js
 ┃ ┃ ┣ mockCustomers.js
 ┃ ┃ ┣ mockFTDH.js
 ┃ ┃ ┗ mockTranscriptions.js
 ┃ ┣ hooks
 ┃ ┣ lib
 ┃ ┃ ┗ utils.js
 ┃ ┣ pages
 ┃ ┃ ┣ auth
 ┃ ┃ ┃ ┗ LoginPage.jsx
 ┃ ┃ ┣ cases
 ┃ ┃ ┃ ┣ CaseDetailPage.jsx
 ┃ ┃ ┃ ┣ CaseImportPage.jsx
 ┃ ┃ ┃ ┣ CaseListPage.jsx
 ┃ ┃ ┃ ┣ CreateCasePage.jsx
 ┃ ┃ ┃ ┣ InvestigationFormPage.jsx
 ┃ ┃ ┃ ┣ InvestigationPage.jsx
 ┃ ┃ ┃ ┣ InvestigationReviewPage.jsx
 ┃ ┃ ┃ ┣ ReportViewPage.jsx
 ┃ ┃ ┃ ┣ SupervisorInvestigationReportPage.jsx
 ┃ ┃ ┃ ┗ SupervisorReviewPage.jsx
 ┃ ┃ ┣ dashboard
 ┃ ┃ ┃ ┗ DashboardPage.jsx
 ┃ ┃ ┗ ftdh
 ┃ ┃ ┃ ┣ FTDHBranchDetailPage.jsx
 ┃ ┃ ┃ ┣ FTDHBranchPage.jsx
 ┃ ┃ ┃ ┣ FTDHDetailPage.jsx
 ┃ ┃ ┃ ┣ FTDHInwardPage.jsx
 ┃ ┃ ┃ ┣ FTDHOutwardDetailPage.jsx
 ┃ ┃ ┃ ┗ FTDHOutwardPage.jsx
 ┃ ┣ routes
 ┃ ┃ ┗ index.jsx
 ┃ ┣ utils
 ┃ ┃ ┣ caseImport.js
 ┃ ┃ ┣ parseActivityLog.js
 ┃ ┃ ┗ permissions.js
 ┃ ┣ App.jsx
 ┃ ┣ index.css
 ┃ ┗ main.jsx
 ┣ .env.example
 ┣ .gitignore
 ┣ CLAUDE.md
 ┣ GEMINI.md
 ┣ README.md
 ┣ components.json
 ┣ eslint.config.js
 ┣ index.html
 ┣ investigation_form_fields.md
 ┣ jsconfig.json
 ┣ package-lock.json
 ┣ package.json
 ┗ vite.config.js
```
