<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Tenant-scoped migrations live in database/migrations/tenant.
     * Include them so RefreshDatabase sets up the full schema.
     */
    protected function migrateFreshUsing(): array
    {
        return [
            '--drop-views' => $this->shouldDropViews(),
            '--drop-types' => $this->shouldDropTypes(),
            '--path' => ['database/migrations', 'database/migrations/tenant'],
        ];
    }
}
