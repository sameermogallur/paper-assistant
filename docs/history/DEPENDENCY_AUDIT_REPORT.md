# Dependency Audit Report
**Date:** 2026-01-15
**Project:** Paper Assistant

## Executive Summary

This audit identified **10 security vulnerabilities**, **multiple outdated packages**, and **significant dependency bloat** across both Python and JavaScript dependencies. Immediate action is recommended for critical security vulnerabilities.

---

## 🚨 Critical Security Vulnerabilities

### Python Dependencies

| Package | Current | Fix Version | CVEs | Severity |
|---------|---------|-------------|------|----------|
| **pypdf** | 4.2.0 | 6.6.0 | 6 CVEs (CVE-2025-55197, CVE-2025-62707, CVE-2025-62708, CVE-2025-66019, CVE-2026-22690, CVE-2026-22691) | **CRITICAL** |
| **python-multipart** | 0.0.9 | 0.0.18 | CVE-2024-53981 | **HIGH** |
| **starlette** | 0.36.3 | 0.47.2 | CVE-2024-47874, CVE-2025-54121 | **HIGH** |
| **streamlit** | 1.35.0 | 1.37.0 | PYSEC-2024-153 | **MEDIUM** |

### Frontend Dependencies

| Package | Current | Issue | Severity |
|---------|---------|-------|----------|
| **react-router-dom** | 7.2.0 | CSRF, XSS vulnerabilities (GHSA-h5cw-625j-3rxh, GHSA-2w69-qvjg-hvjx, GHSA-8v8x-cx79-35w7) | **HIGH** |
| **diff** (transitive) | <8.0.3 | DoS vulnerability (GHSA-73rr-hh4g-fpgx) | **MODERATE** |

---

## 📦 Outdated Packages

### Python

| Package | Current | Latest | Update Type |
|---------|---------|--------|-------------|
| fastapi | 0.110.0 | Check latest | Minor/Patch |
| uvicorn | 0.29.0 | Check latest | Minor/Patch |
| openai | 1.35.7 | Check latest | Minor/Patch |
| Pillow | 10.3.0 | Check latest | Minor/Patch |
| pydantic | 2.7.1 | Check latest | Minor/Patch |
| pandas | 2.2.2 | Check latest | Minor/Patch |

### Frontend

| Package | Current | Latest | Update Type | Breaking? |
|---------|---------|--------|-------------|-----------|
| **@base44/sdk** | 0.1.2 | 0.8.18 | Major | ⚠️ Yes |
| **react** | 18.2.0 | 19.2.3 | Major | ⚠️ Yes |
| **react-dom** | 18.2.0 | 19.2.3 | Major | ⚠️ Yes |
| **zod** | 3.24.2 | 4.3.5 | Major | ⚠️ Yes |
| **@hookform/resolvers** | 4.1.2 | 5.2.2 | Major | ⚠️ Yes |
| **date-fns** | 3.6.0 | 4.1.0 | Major | ⚠️ Yes |
| **react-day-picker** | 8.10.1 | 9.13.0 | Major | ⚠️ Yes |
| **react-resizable-panels** | 2.1.7 | 4.4.1 | Major | ⚠️ Yes |
| **recharts** | 2.15.1 | 3.6.0 | Major | ⚠️ Yes |
| lucide-react | 0.475.0 | 0.562.0 | Minor | No |

---

## 🗑️ Unnecessary Bloat & Unused Dependencies

### Frontend - Unused UI Components & Their Dependencies

The following UI component files exist but are **NOT imported or used** anywhere in the application:

| UI Component File | Associated Package(s) | Size Impact | Recommendation |
|-------------------|----------------------|-------------|----------------|
| `calendar.jsx` | `react-day-picker` | ~100KB | **REMOVE** |
| `carousel.jsx` | `embla-carousel-react` | ~50KB | **REMOVE** |
| `chart.jsx` | `recharts` | ~500KB+ | **REMOVE** |
| `command.jsx` | `cmdk` | ~40KB | **REMOVE** |
| `drawer.jsx` | `vaul` | ~30KB | **REMOVE** |
| `input-otp.jsx` | `input-otp` | ~20KB | **REMOVE** |
| `resizable.jsx` | `react-resizable-panels` | ~60KB | **REMOVE** |
| `sonner.jsx` | `sonner`, `next-themes` | ~50KB | **REMOVE** |

**Total potential savings: ~850KB+ in bundle size**

### Python - Potentially Redundant Dependencies

| Issue | Details | Recommendation |
|-------|---------|----------------|
| **Multiple Streamlit apps** | `app.py`, `app_v2.py` alongside `backend.py` | If `backend.py` is the main app, remove Streamlit apps and dependency |
| **Missing dependencies** | `app.py` imports `PyPDF2` (not in requirements.txt)<br>`app_v2.py` imports `requests` (not in requirements.txt) | Add missing deps or remove unused files |
| **Redundant PDF libraries** | `pypdf` in requirements.txt, `PyPDF2` imported in code | Standardize on one library (recommend pypdf) |
| **Unused dependencies** | If Streamlit apps are deprecated: `streamlit`, `openai` (only in app.py), `pandas` (only in app_v2.py) | Remove if not needed |

---

## 📋 Detailed Recommendations

### Immediate Actions (Priority 1 - Security)

1. **Update pypdf** ⚠️ CRITICAL
   ```bash
   # Update requirements.txt
   pypdf==6.6.0  # was 4.2.0
   ```

2. **Update python-multipart** ⚠️ HIGH
   ```bash
   python-multipart==0.0.18  # was 0.0.9
   ```

3. **Update FastAPI dependencies**
   ```bash
   fastapi==0.115.0  # Update to latest stable
   # This will update starlette as a dependency
   ```

4. **Update streamlit** (if keeping)
   ```bash
   streamlit==1.37.0  # was 1.35.0
   ```

5. **Update react-router-dom**
   ```bash
   npm install react-router-dom@latest
   ```

### Short-term Actions (Priority 2 - Cleanup)

6. **Remove unused frontend dependencies**
   ```bash
   npm uninstall cmdk embla-carousel-react input-otp next-themes \
                 react-day-picker react-resizable-panels recharts \
                 sonner vaul
   ```

7. **Delete unused UI component files**
   ```bash
   rm frontend/src/components/ui/{calendar,carousel,chart,command,drawer,input-otp,resizable,sonner}.jsx
   ```

8. **Clarify Python application structure**
   - Determine if `app.py` and `app_v2.py` are still needed
   - If not, remove them and their unique dependencies:
     ```bash
     # If removing Streamlit apps, update requirements.txt to remove:
     # streamlit, openai (if not used elsewhere), pandas (if not used elsewhere)
     ```

9. **Fix missing Python dependencies**
   - If keeping `app.py`: Add `PyPDF2` to requirements.txt OR migrate to `pypdf`
   - If keeping `app_v2.py`: Add `requests` to requirements.txt OR use `httpx`

### Medium-term Actions (Priority 3 - Updates)

10. **Plan React 19 migration**
    - React 19 has breaking changes
    - Test thoroughly before upgrading
    - Update `react` and `react-dom` together
    ```bash
    npm install react@19 react-dom@19
    ```

11. **Update other major version packages** (test individually)
    - `@base44/sdk`: 0.1.2 → 0.8.18 (check changelog)
    - `zod`: 3.24.2 → 4.3.5 (breaking changes)
    - `@hookform/resolvers`: 4.1.2 → 5.2.2
    - `date-fns`: 3.6.0 → 4.1.0

12. **Update Python packages to latest stable versions**
    ```bash
    fastapi==0.115.0
    uvicorn==0.32.0
    httpx==0.28.0
    Pillow==11.0.0
    pydantic==2.10.0
    ```

---

## 📊 Impact Summary

### Security Risk Reduction
- **10 vulnerabilities** will be fixed
- **Risk level** reduced from HIGH to LOW

### Performance Improvements
- **Frontend bundle size**: Reduce by ~850KB+ (~15-20% reduction estimated)
- **Installation time**: Faster npm/pip install
- **Build time**: Faster builds with fewer dependencies

### Maintenance Benefits
- Fewer packages to maintain and update
- Reduced security surface area
- Clearer codebase without unused code

---

## 🔄 Suggested Updated Dependencies

### requirements.txt (Updated)
```txt
# Web Framework
fastapi==0.115.0
uvicorn[standard]==0.32.0
python-multipart==0.0.18

# HTTP & Async
httpx==0.28.0
watchfiles==0.21.0

# PDF Processing
pypdf==6.6.0
pdf2image==1.17.0
pytesseract==0.3.10
Pillow==11.0.0

# Optional: Only if keeping Streamlit apps
# streamlit==1.37.0
# openai==1.52.0
# pandas==2.2.2

# Data & Validation
pydantic==2.10.0
python-dotenv==1.0.1
cachetools==5.3.3
```

### package.json (Minimal - After Cleanup)
```json
{
  "dependencies": {
    "@base44/sdk": "^0.8.18",
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-*": "[keep all current versions, update to latest patch]",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.26.2",
    "lucide-react": "^0.562.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.71.1",
    "react-router-dom": "^7.12.0",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^4.3.5"
  }
}
```

---

## ✅ Action Plan

### Week 1: Security Fixes
- [ ] Update all Python packages with security vulnerabilities
- [ ] Update react-router-dom
- [ ] Run full test suite
- [ ] Deploy security updates

### Week 2: Cleanup
- [ ] Remove unused frontend dependencies and files
- [ ] Clarify and clean up Python application structure
- [ ] Remove unused Python files and dependencies
- [ ] Update documentation

### Week 3: Major Updates
- [ ] Plan and execute React 19 migration (if desired)
- [ ] Update other major version packages incrementally
- [ ] Update Python packages to latest stable versions
- [ ] Performance testing

---

## 📝 Notes

1. **Testing Required**: All updates should be tested in a development environment first
2. **Breaking Changes**: Major version updates may require code changes
3. **Bundle Analysis**: Run `npm run build` and analyze bundle size before/after cleanup
4. **Backup**: Ensure git commits before making changes
5. **Staggered Updates**: Don't update everything at once - do it incrementally

---

## 🔗 References

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [pip-audit](https://pypi.org/project/pip-audit/)
- [React 19 Migration Guide](https://react.dev/blog/2024/04/25/react-19)
- [FastAPI Security Updates](https://fastapi.tiangolo.com/release-notes/)

---

**Report Generated:** 2026-01-15
**Tools Used:** npm audit, pip-audit, manual code analysis
