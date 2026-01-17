# Plan de Implementación: Módulo de Solicitudes de Crédito en Sucursal Bancaria

## Descripción General

Este documento describe el plan de implementación para una nueva página de sucursal bancaria que permitirá a los empleados del banco gestionar solicitudes de crédito de clientes, incluyendo préstamos personales y automotrices, así como la consulta de calendarios de pagos mediante APIs de Temenos Transact.

---

## 1. Arquitectura Propuesta

### 1.1 Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  BranchLoanPage │  │ LoanApplication │  │ PaymentSchedule     │ │
│  │  (Página Ppal)  │  │ Form Component  │  │ Viewer Component    │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘ │
│           │                    │                       │            │
│  ┌────────┴────────────────────┴───────────────────────┴──────────┐ │
│  │                    LoanService (API Client)                     │ │
│  └─────────────────────────────┬──────────────────────────────────┘ │
└────────────────────────────────┼────────────────────────────────────┘
                                 │ HTTP/REST
┌────────────────────────────────┼────────────────────────────────────┐
│                         BACKEND (FastAPI)                           │
├────────────────────────────────┼────────────────────────────────────┤
│  ┌─────────────────────────────┴──────────────────────────────────┐ │
│  │                    /api/v1/loans/*                              │ │
│  │         (Endpoints de Préstamos y Calendarios)                  │ │
│  └─────────────────────────────┬──────────────────────────────────┘ │
│                                │                                    │
│  ┌─────────────────────────────┴──────────────────────────────────┐ │
│  │                    LoanService (Business Logic)                 │ │
│  └─────────────────────────────┬──────────────────────────────────┘ │
│                                │                                    │
│  ┌─────────────────────────────┴──────────────────────────────────┐ │
│  │                    TransactAdapter (External API)               │ │
│  └─────────────────────────────┬──────────────────────────────────┘ │
└────────────────────────────────┼────────────────────────────────────┘
                                 │ HTTPS
                    ┌────────────┴────────────┐
                    │   Temenos Transact API  │
                    │   - Loans API           │
                    │   - Arrangements API    │
                    │   - Payments API        │
                    └─────────────────────────┘
```

### 1.2 APIs de Transact a Utilizar

| API | Endpoint | Propósito |
|-----|----------|-----------|
| **Party API** | `/party/customers` | Gestión de información del cliente |
| **Arrangements API** | `/holdings/arrangements` | Creación y gestión de préstamos |
| **Loans API** | `/holdings/loans` | Operaciones específicas de préstamos |
| **Payment Schedules API** | `/holdings/paymentSchedules` | Consulta de calendarios de pago |
| **Product Catalog API** | `/reference/products` | Catálogo de productos de crédito |

---

## 2. Estructura de Archivos a Crear

### 2.1 Frontend

```
frontend/src/
├── components/
│   └── loans/
│       ├── BranchLoanPage.tsx           # Página principal de sucursal
│       ├── CustomerSearch.tsx            # Búsqueda de cliente
│       ├── CustomerInfo.tsx              # Información del cliente
│       ├── LoanTypeSelector.tsx          # Selector: Personal vs Automotriz
│       ├── PersonalLoanForm.tsx          # Formulario préstamo personal
│       ├── AutoLoanForm.tsx              # Formulario préstamo automotriz
│       ├── LoanSimulator.tsx             # Simulador de préstamo
│       ├── PaymentScheduleViewer.tsx     # Visor de calendario de pagos
│       ├── LoanApplicationSummary.tsx    # Resumen de solicitud
│       └── LoanConfirmation.tsx          # Confirmación de creación
│
├── services/
│   └── loanService.ts                    # Cliente API para préstamos
│
├── types/
│   └── loans.ts                          # Interfaces TypeScript
│
└── hooks/
    └── useLoanOperations.ts              # Hook personalizado para operaciones
```

### 2.2 Backend

```
backend/app/
├── api/
│   └── loans.py                          # Endpoints REST de préstamos
│
├── services/
│   └── loan_service.py                   # Lógica de negocio de préstamos
│
├── adapters/
│   └── transact/
│       ├── base.py                       # Interface base del adapter
│       ├── transact_adapter.py           # Implementación Transact API
│       └── factory.py                    # Factory para el adapter
│
├── models/
│   ├── loan.py                           # Modelos de préstamo
│   ├── customer.py                       # Modelo de cliente
│   └── payment_schedule.py               # Modelo de calendario de pagos
│
└── schemas/
    └── loan_schemas.py                   # Schemas Pydantic para validación
```

---

## 3. Funcionalidades Detalladas

### 3.1 Búsqueda y Selección de Cliente

**Descripción:** Permitir al empleado de sucursal buscar un cliente existente o registrar uno nuevo.

**Campos de búsqueda:**
- Número de identificación (INE/Pasaporte)
- Nombre completo
- Número de cuenta existente
- Teléfono

**Información a mostrar del cliente:**
- Datos personales (nombre, dirección, teléfono, email)
- Historial crediticio resumido
- Productos activos
- Score crediticio (si disponible)

### 3.2 Préstamo Personal

**Datos requeridos:**
| Campo | Tipo | Validación |
|-------|------|------------|
| Monto solicitado | Numérico | Min: $5,000 - Max: $500,000 |
| Plazo (meses) | Selección | 6, 12, 18, 24, 36, 48, 60 |
| Destino del crédito | Selección | Lista predefinida |
| Ingresos mensuales | Numérico | Requerido |
| Tipo de empleo | Selección | Asalariado/Independiente/Otro |
| Antigüedad laboral | Numérico | Meses |

**Proceso:**
1. Captura de datos del préstamo
2. Simulación con cálculo de mensualidad
3. Validación de elegibilidad
4. Generación de calendario de pagos provisional
5. Confirmación y envío a Transact
6. Recepción de número de solicitud/contrato

### 3.3 Préstamo Automotriz

**Datos requeridos:**
| Campo | Tipo | Validación |
|-------|------|------------|
| Monto del vehículo | Numérico | Precio total |
| Enganche | Numérico | Min: 10% del valor |
| Monto a financiar | Calculado | Vehículo - Enganche |
| Plazo (meses) | Selección | 12, 24, 36, 48, 60, 72 |
| Marca del vehículo | Texto | Requerido |
| Modelo | Texto | Requerido |
| Año | Numérico | Actual o ±2 años |
| Tipo | Selección | Nuevo/Seminuevo |
| VIN (opcional) | Texto | 17 caracteres |

**Proceso:**
1. Captura de información del vehículo
2. Captura de datos financieros
3. Cálculo de enganche mínimo
4. Simulación con tasa según tipo de vehículo
5. Generación de calendario de pagos
6. Envío a Transact con información de garantía (vehículo)

### 3.4 Consulta de Calendario de Pagos

**Funcionalidades:**
- Búsqueda por número de préstamo/contrato
- Visualización de calendario completo
- Filtrado por estado (pendiente, pagado, vencido)
- Exportación a PDF/Excel
- Vista de próximo pago destacada

**Información por pago:**
| Campo | Descripción |
|-------|-------------|
| Número de pago | Secuencial |
| Fecha de vencimiento | DD/MM/YYYY |
| Capital | Monto a capital |
| Interés | Monto de interés |
| IVA del interés | Impuesto |
| Pago total | Suma de componentes |
| Saldo insoluto | Capital pendiente |
| Estado | Pendiente/Pagado/Vencido |

---

## 4. Integración con Transact API

### 4.1 Configuración del Adapter

```python
# backend/app/adapters/transact/transact_adapter.py

class TransactAdapter:
    """Adapter para comunicación con Temenos Transact API"""

    def __init__(self):
        self.base_url = settings.TRANSACT_API_URL
        self.api_key = settings.TRANSACT_API_KEY

    async def create_personal_loan(self, loan_data: PersonalLoanCreate) -> LoanResponse:
        """Crear préstamo personal en Transact"""
        pass

    async def create_auto_loan(self, loan_data: AutoLoanCreate) -> LoanResponse:
        """Crear préstamo automotriz en Transact"""
        pass

    async def get_payment_schedule(self, arrangement_id: str) -> PaymentSchedule:
        """Obtener calendario de pagos de Transact"""
        pass

    async def simulate_loan(self, simulation_data: LoanSimulation) -> SimulationResult:
        """Simular préstamo sin crear"""
        pass
```

### 4.2 Endpoints del Backend

```python
# backend/app/api/loans.py

@router.post("/loans/personal", response_model=LoanResponse)
async def create_personal_loan(
    loan: PersonalLoanCreate,
    current_user: User = Depends(get_current_user)
):
    """Crear solicitud de préstamo personal"""
    pass

@router.post("/loans/auto", response_model=LoanResponse)
async def create_auto_loan(
    loan: AutoLoanCreate,
    current_user: User = Depends(get_current_user)
):
    """Crear solicitud de préstamo automotriz"""
    pass

@router.get("/loans/{loan_id}/schedule", response_model=PaymentScheduleResponse)
async def get_payment_schedule(
    loan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Obtener calendario de pagos"""
    pass

@router.post("/loans/simulate", response_model=SimulationResult)
async def simulate_loan(
    simulation: LoanSimulationRequest,
    current_user: User = Depends(get_current_user)
):
    """Simular préstamo"""
    pass

@router.get("/customers/{customer_id}/loans", response_model=List[LoanSummary])
async def get_customer_loans(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Obtener préstamos de un cliente"""
    pass
```

### 4.3 Servicio del Frontend

```typescript
// frontend/src/services/loanService.ts

export const loanService = {
  // Préstamos
  createPersonalLoan: (data: PersonalLoanRequest) =>
    api.post<LoanResponse>('/loans/personal', data),

  createAutoLoan: (data: AutoLoanRequest) =>
    api.post<LoanResponse>('/loans/auto', data),

  // Simulación
  simulateLoan: (data: LoanSimulationRequest) =>
    api.post<SimulationResult>('/loans/simulate', data),

  // Calendario de pagos
  getPaymentSchedule: (loanId: string) =>
    api.get<PaymentSchedule>(`/loans/${loanId}/schedule`),

  // Clientes
  searchCustomer: (query: CustomerSearchQuery) =>
    api.get<Customer[]>('/customers/search', { params: query }),

  getCustomerLoans: (customerId: string) =>
    api.get<LoanSummary[]>(`/customers/${customerId}/loans`),
};
```

---

## 5. Diseño de Interfaz de Usuario

### 5.1 Layout de la Página Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Sucursal Bancaria - Solicitudes de Crédito | Usuario│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  PASO 1: BÚSQUEDA DE CLIENTE                                  │ │
│  │  [Búsqueda por ID] [Búsqueda por nombre] [Nuevo cliente]      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  INFORMACIÓN DEL CLIENTE                                       │ │
│  │  Nombre: _______ | ID: _______ | Score: ___                   │ │
│  │  Productos activos: [Lista]                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  PASO 2: SELECCIÓN DE PRODUCTO                                │ │
│  │  ┌─────────────────┐    ┌─────────────────┐                   │ │
│  │  │  PRÉSTAMO       │    │  PRÉSTAMO       │                   │ │
│  │  │  PERSONAL       │    │  AUTOMOTRIZ     │                   │ │
│  │  │  [Icono]        │    │  [Icono Auto]   │                   │ │
│  │  └─────────────────┘    └─────────────────┘                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌─────────────────────────┬─────────────────────────────────────┐ │
│  │  FORMULARIO DE          │  SIMULADOR                          │ │
│  │  SOLICITUD              │  ┌─────────────────────────────────┐│ │
│  │                         │  │ Monto: $XXX,XXX                 ││ │
│  │  [Campos según tipo]    │  │ Plazo: XX meses                 ││ │
│  │                         │  │ Tasa: XX.XX%                    ││ │
│  │                         │  │ ─────────────────               ││ │
│  │                         │  │ Mensualidad: $XX,XXX            ││ │
│  │                         │  │ Total a pagar: $XXX,XXX         ││ │
│  │                         │  │ Intereses totales: $XX,XXX      ││ │
│  │                         │  └─────────────────────────────────┘│ │
│  └─────────────────────────┴─────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  CALENDARIO DE PAGOS PROVISIONAL                               │ │
│  │  [Tabla con primeros 6 pagos] [Ver calendario completo]        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  [Cancelar]                    [Confirmar y Enviar Solicitud] │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Componentes de UI

- **Cards** para selección de tipo de préstamo
- **Stepper/Wizard** para guiar el proceso
- **Formularios** con validación en tiempo real
- **Tabla interactiva** para calendario de pagos
- **Modal** para confirmación final
- **Toast notifications** para feedback

---

## 6. Modelo de Datos

### 6.1 Interfaces TypeScript (Frontend)

```typescript
// frontend/src/types/loans.ts

interface Customer {
  id: string;
  documentType: 'INE' | 'PASSPORT' | 'OTHER';
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  creditScore?: number;
  activeProducts: ProductSummary[];
}

interface PersonalLoanRequest {
  customerId: string;
  amount: number;
  termMonths: number;
  purpose: LoanPurpose;
  monthlyIncome: number;
  employmentType: EmploymentType;
  employmentMonths: number;
}

interface AutoLoanRequest {
  customerId: string;
  vehiclePrice: number;
  downPayment: number;
  termMonths: number;
  vehicleInfo: VehicleInfo;
}

interface VehicleInfo {
  brand: string;
  model: string;
  year: number;
  type: 'NEW' | 'USED';
  vin?: string;
}

interface PaymentSchedule {
  loanId: string;
  currency: string;
  payments: Payment[];
  summary: ScheduleSummary;
}

interface Payment {
  paymentNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  tax: number;
  totalPayment: number;
  remainingBalance: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}
```

### 6.2 Modelos Pydantic (Backend)

```python
# backend/app/models/loan.py

class PersonalLoanCreate(BaseModel):
    customer_id: str
    amount: Decimal = Field(..., ge=5000, le=500000)
    term_months: int = Field(..., ge=6, le=60)
    purpose: LoanPurpose
    monthly_income: Decimal
    employment_type: EmploymentType
    employment_months: int

class AutoLoanCreate(BaseModel):
    customer_id: str
    vehicle_price: Decimal
    down_payment: Decimal
    term_months: int = Field(..., ge=12, le=72)
    vehicle_info: VehicleInfo

class LoanResponse(BaseModel):
    loan_id: str
    arrangement_id: str
    status: LoanStatus
    amount: Decimal
    term_months: int
    interest_rate: Decimal
    monthly_payment: Decimal
    created_at: datetime

class PaymentScheduleResponse(BaseModel):
    loan_id: str
    currency: str = "MXN"
    payments: List[Payment]
    summary: ScheduleSummary
```

---

## 7. Seguridad y Validaciones

### 7.1 Validaciones de Negocio

| Validación | Regla |
|------------|-------|
| Monto mínimo préstamo personal | $5,000 MXN |
| Monto máximo préstamo personal | $500,000 MXN |
| Enganche mínimo automotriz | 10% del valor del vehículo |
| Relación pago/ingreso máxima | 40% del ingreso mensual |
| Edad mínima del solicitante | 18 años |
| Edad máxima al término del crédito | 75 años |

### 7.2 Seguridad

- **Autenticación:** JWT requerido para todos los endpoints
- **Autorización:** Rol de "branch_officer" requerido
- **Auditoría:** Log de todas las operaciones de préstamo
- **Encriptación:** Datos sensibles encriptados en tránsito y reposo
- **Rate limiting:** Máximo 100 solicitudes por minuto por usuario

---

## 8. Variables de Entorno Requeridas

```bash
# Transact API Configuration
TRANSACT_API_URL=https://api.transact.temenos.com
TRANSACT_API_KEY=your_api_key_here
TRANSACT_API_VERSION=v1.0.0

# Loan Configuration
LOAN_DEFAULT_CURRENCY=MXN
LOAN_PERSONAL_MIN_AMOUNT=5000
LOAN_PERSONAL_MAX_AMOUNT=500000
LOAN_AUTO_MIN_DOWN_PAYMENT_PERCENT=10
LOAN_MAX_PAYMENT_TO_INCOME_RATIO=0.40

# Product IDs in Transact
TRANSACT_PERSONAL_LOAN_PRODUCT_ID=PERSONAL.LOAN
TRANSACT_AUTO_LOAN_PRODUCT_ID=AUTO.LOAN
```

---

## 9. Tareas de Implementación

### Fase 1: Infraestructura (Backend)
- [ ] Crear adapter de Transact (`transact_adapter.py`)
- [ ] Implementar modelos de datos (`loan.py`, `customer.py`, `payment_schedule.py`)
- [ ] Crear schemas de validación (`loan_schemas.py`)
- [ ] Implementar servicio de préstamos (`loan_service.py`)
- [ ] Crear endpoints REST (`loans.py`)
- [ ] Agregar pruebas unitarias

### Fase 2: Interfaz de Usuario (Frontend)
- [ ] Crear página principal (`BranchLoanPage.tsx`)
- [ ] Implementar búsqueda de cliente (`CustomerSearch.tsx`)
- [ ] Crear selector de tipo de préstamo (`LoanTypeSelector.tsx`)
- [ ] Implementar formulario de préstamo personal (`PersonalLoanForm.tsx`)
- [ ] Implementar formulario de préstamo automotriz (`AutoLoanForm.tsx`)
- [ ] Crear simulador de préstamo (`LoanSimulator.tsx`)
- [ ] Implementar visor de calendario de pagos (`PaymentScheduleViewer.tsx`)
- [ ] Crear servicio API (`loanService.ts`)
- [ ] Definir tipos TypeScript (`loans.ts`)

### Fase 3: Integración y Pruebas
- [ ] Integrar frontend con backend
- [ ] Pruebas de integración con Transact API
- [ ] Pruebas de flujo completo end-to-end
- [ ] Validación de cálculos financieros
- [ ] Pruebas de rendimiento

### Fase 4: Documentación y Despliegue
- [ ] Documentar APIs (OpenAPI/Swagger)
- [ ] Crear guía de usuario
- [ ] Configurar variables de entorno en producción
- [ ] Desplegar en ambiente de staging
- [ ] Pruebas de aceptación de usuario (UAT)
- [ ] Despliegue en producción

---

## 10. Consideraciones Adicionales

### 10.1 Manejo de Errores

- Implementar mensajes de error claros y accionables
- Reintentos automáticos para errores de red transitorios
- Fallback a modo offline para consultas (cache local)

### 10.2 Experiencia de Usuario

- Indicadores de progreso durante operaciones largas
- Autoguardado de formularios parcialmente completados
- Tooltips y ayuda contextual en campos complejos

### 10.3 Escalabilidad

- Cache de productos y tasas (actualización cada hora)
- Paginación en consultas de calendario de pagos
- Lazy loading de historial del cliente

---

## 11. Dependencias Técnicas

### Backend (agregar a requirements.txt)
```
httpx>=0.25.0          # Cliente HTTP async para Transact API
python-decimal>=1.3    # Manejo preciso de decimales financieros
```

### Frontend (agregar a package.json)
```json
{
  "dependencies": {
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@tanstack/react-table": "^8.11.0",
    "date-fns": "^3.0.0"
  }
}
```

---

*Documento creado: Enero 2026*
*Versión: 1.0*
*Autor: Claude AI Assistant*
