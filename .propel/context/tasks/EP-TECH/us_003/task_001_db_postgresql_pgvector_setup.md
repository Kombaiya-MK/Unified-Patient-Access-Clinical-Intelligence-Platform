# Task - TASK_001_DB_POSTGRESQL_PGVECTOR_SETUP

## Requirement Reference
- User Story: US_003  
- Story Location: `.propel/context/tasks/us_003/us_003.md`
- Acceptance Criteria:
    - AC1: PostgreSQL 15+ installed, UPACI database created with pgvector extension enabled, connection test succeeds
    - AC4: pgvector enabled and can store/retrieve test embedding vectors using cosine similarity search (<-> operator)
- Edge Cases:
    - pgvector extension fails to install: Provide installation guide for Windows/Linux and alternate fallback without vector search
    - Database connection failures during startup: Retry 3 times with exponential backoff, then exit with error

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Database infrastructure - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | N/A | N/A |
| Database | PostgreSQL | 15+ |
| Database | pgvector | 0.5.0+ |
| AI/ML | N/A (extension only) | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Partial (pgvector for embeddings) |
| **AIR Requirements** | N/A |
| **AI Pattern** | Vector similarity search infrastructure |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Enables AI vector search but no model integration yet

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend database only

## Task Overview
Install PostgreSQL 15+ database server, enable pgvector extension for AI vector similarity search, create UPACI database, and verify installation with connection test and vector operations. Provide comprehensive installation guides for Windows and Linux environments with troubleshooting steps for common pgvector extension issues. Document fallback strategy when vector search is unavailable.

## Dependent Tasks
- US_002: Backend Express API must be set up (for database connection configuration)

## Impacted Components
**New:**
- database/install/ (installation scripts and guides)
- database/scripts/01_init_database.sql (database and extension creation)
- database/scripts/99_test_connection.sql (connection and pgvector test)
- database/docs/INSTALLATION.md (platform-specific installation guides)
- database/docs/TROUBLESHOOTING.md (common issues and solutions)
- database/.env.example (database connection variables)

## Implementation Plan
1. **PostgreSQL Installation**: Create installation guide for PostgreSQL 15.x on Windows (installer) and Linux (apt/yum)
2. **pgvector Extension Setup**: Document pgvector compilation from source (Linux) and prebuilt binaries (Windows)
3. **Database Initialization Script**: Write SQL script to create UPACI database and enable pgvector extension
4. **Connection Test Script**: Create SQL test to verify database connectivity and extension functionality
5. **Vector Operations Test**: Write SQL query to test vector insertion, storage, and cosine similarity search
6. **Fallback Strategy Documentation**: Document application behavior when pgvector is unavailable (disable AI features)
7. **Environment Configuration**: Create .env.example with DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL
8. **Windows Installation Guide**: PowerShell scripts for PostgreSQL + pgvector installation on Windows 10/11
9. **Linux Installation Guide**: Bash scripts for PostgreSQL + pgvector on Ubuntu 20.04+/Debian 11+
10. **Troubleshooting Documentation**: Common errors (extension not found, permission denied, connection refused)

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001)
├── server/               # Backend API (US_002)
└── (database/ to be created)  # Database scripts and docs
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/install/windows-install.ps1 | PowerShell script to install PostgreSQL 15 + pgvector on Windows |
| CREATE | database/install/linux-install.sh | Bash script to install PostgreSQL 15 + pgvector on Ubuntu/Debian |
| CREATE | database/scripts/01_init_database.sql | CREATE DATABASE upaci; CREATE EXTENSION pgvector; |
| CREATE | database/scripts/99_test_connection.sql | SELECT version(); SELECT * FROM pg_extension WHERE extname='vector'; |
| CREATE | database/scripts/99_test_vector_operations.sql | Test vector insertion and cosine similarity (<->) search |
| CREATE | database/docs/INSTALLATION.md | Step-by-step installation guide (Windows, Linux, Docker) |
| CREATE | database/docs/TROUBLESHOOTING.md | Common errors and solutions (pgvector not found, permissions) |
| CREATE | database/docs/FALLBACK_STRATEGY.md | Application behavior when pgvector unavailable |
| CREATE | database/.env.example | DB_HOST=localhost, DB_PORT=5432, DB_NAME=upaci, DB_USER, DB_PASSWORD, DB_SSL=false |
| CREATE | database/README.md | Overview, quick start, links to detailed docs |
| CREATE | database/.gitignore | Exclude sensitive files (*.pem, *.key, backups/) |

> All files created as new - no existing database setup

## External References
- [PostgreSQL 15 Download](https://www.postgresql.org/download/)
- [pgvector GitHub Repository](https://github.com/pgvector/pgvector)
- [pgvector Installation Guide](https://github.com/pgvector/pgvector#installation)
- [PostgreSQL CREATE EXTENSION](https://www.postgresql.org/docs/15/sql-createextension.html)
- [pgvector Operators (cosine, L2, inner product)](https://github.com/pgvector/pgvector#operators)
- [PostgreSQL Windows Installation](https://www.postgresql.org/download/windows/)
- [PostgreSQL Ubuntu Installation](https://www.postgresql.org/download/linux/ubuntu/)
- [Vector Similarity Search Best Practices](https://supabase.com/blog/pgvector-vs-pinecone)

## Build Commands
```bash
# Windows Installation (PowerShell as Administrator)
cd database/install
.\windows-install.ps1

# Linux Installation (Ubuntu/Debian)
cd database/install
chmod +x linux-install.sh
sudo ./linux-install.sh

# Initialize Database (after PostgreSQL installed)
psql -U postgres -f database/scripts/01_init_database.sql

# Test Connection
psql -U postgres -d upaci -f database/scripts/99_test_connection.sql

# Test Vector Operations
psql -U postgres -d upaci -f database/scripts/99_test_vector_operations.sql

# Docker Alternative (PostgreSQL 15 + pgvector)
docker run -d \
  --name upaci-postgres \
  -e POSTGRES_DB=upaci \
  -e POSTGRES_USER=upaci_user \
  -e POSTGRES_PASSWORD=change_me \
  -p 5432:5432 \
  ankane/pgvector:latest

# Verify Docker Container
docker exec -it upaci-postgres psql -U upaci_user -d upaci -c "SELECT version();"
docker exec -it upaci-postgres psql -U upaci_user -d upaci -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## Implementation Validation Strategy
- [x] Unit tests pass (N/A for infrastructure)
- [x] Integration tests pass (connection test scripts)
- [x] PostgreSQL 15+ installed successfully: `psql --version` returns 15.x or higher
- [x] Database service running: Windows Services (postgresql-x64-15) or `sudo systemctl status postgresql`
- [x] pgvector extension available: `SELECT * FROM pg_available_extensions WHERE name='vector';`
- [x] UPACI database created: `psql -U postgres -l` shows upaci database
- [x] pgvector extension enabled: `SELECT * FROM pg_extension WHERE extname='vector';` returns 1 row
- [x] Connection from external client succeeds: `psql -h localhost -U postgres -d upaci` connects
- [x] Vector insertion works: `CREATE TABLE test_embeddings (id serial, embedding vector(3)); INSERT INTO test_embeddings (embedding) VALUES ('[1,2,3]');`
- [x] Cosine similarity search works: `SELECT * FROM test_embeddings ORDER BY embedding <-> '[3,1,2]' LIMIT 5;`
- [x] Environment variables configured: .env file created with correct DB credentials
- [x] Fallback documentation complete: Explains app behavior when pgvector unavailable

## Implementation Checklist
- [x] Create database/ directory structure with install/, scripts/, docs/ subdirectories
- [x] Write windows-install.ps1 script (download PostgreSQL 15 installer, install pgvector from prebuilt binary)
- [x] Write linux-install.sh script (apt-get install postgresql-15, build pgvector from source)
- [x] Create 01_init_database.sql: `CREATE DATABASE upaci;`, `\c upaci`, `CREATE EXTENSION vector;`
- [x] Create 99_test_connection.sql: `SELECT version();`, `SELECT * FROM pg_extension WHERE extname='vector';`
- [x] Create 99_test_vector_operations.sql: Create test table, insert vector, query with cosine similarity
- [x] Document Windows installation in INSTALLATION.md (PostgreSQL installer, pgvector DLL installation)
- [x] Document Linux installation in INSTALLATION.md (apt-get, make, sudo make install for pgvector)
- [x] Document Docker installation in INSTALLATION.md (docker run with ankane/pgvector image)
- [x] Write TROUBLESHOOTING.md: pgvector extension not found (missing DLL, incorrect lib path)
- [x] Write TROUBLESHOOTING.md: Connection refused (check pg_hba.conf, firewall rules)
- [x] Write TROUBLESHOOTING.md: Permission denied (grant privileges, check pg_hba.conf authentication)
- [x] Write FALLBACK_STRATEGY.md: Disable AI-powered search, use PostgreSQL full-text search instead
- [x] Create .env.example with DB_HOST, DB_PORT (5432), DB_NAME (upaci), DB_USER, DB_PASSWORD, DB_SSL (false)
- [x] Test Windows installation script on clean Windows 10/11 machine
- [x] Test Linux installation script on Ubuntu 20.04 and 22.04
- [x] Test Docker installation: `docker run ankane/pgvector`
- [x] Verify pgvector version: `SELECT * FROM pg_available_extensions WHERE name='vector';` shows 0.5.0+
- [x] Test vector data types: vector(1536) for OpenAI embeddings, vector(768) for sentence-transformers
- [x] Document database connection retry logic for Task 003 (3 retries, exponential backoff)
- [x] Create README.md with quick start guide and links to detailed installation docs
