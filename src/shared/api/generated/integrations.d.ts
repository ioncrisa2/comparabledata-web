export interface paths {
    "/v1/integrations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Daftar integrasi
         * @description Daftar aplikasi dan metadata key. Nilai rahasia serta hash key tidak disertakan.
         */
        get: operations["integration.index"];
        put?: never;
        /** Buat integrasi */
        post: operations["integration.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations/scopes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar cakupan izin integrasi */
        get: operations["integration.scopes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations/{integration}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Detail integrasi
         * @description Metadata aplikasi dan seluruh key, tanpa nilai rahasia.
         */
        get: operations["integration.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Ubah integrasi
         * @description is_active=false langsung menonaktifkan akses seluruh key aplikasi.
         */
        patch: operations["integration.update"];
        trace?: never;
    };
    "/v1/integrations/{integration}/keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Terbitkan API key
         * @description plain_text_key hanya dikembalikan sekali. Simpan sebagai secret di backend aplikasi konsumen. Terbitkan key baru untuk rotasi, lalu cabut key lama setelah migrasi.
         */
        post: operations["integration.issueKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations/{integration}/keys/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Cabut API key
         * @description Pencabutan permanen dan langsung berlaku pada request berikutnya.
         */
        delete: operations["integration.revokeKey"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Integration */
        Integration: string[];
    };
    responses: {
        /** @description Validation error */
        ValidationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Errors overview. */
                    message: string;
                    /** @description A detailed description of each field that failed validation. */
                    errors: {
                        [key: string]: string[];
                    };
                };
            };
        };
        /** @description Unauthenticated */
        AuthenticationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
        /** @description Authorization error */
        AuthorizationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
        /** @description Not found */
        ModelNotFoundException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "integration.index": {
        parameters: {
            query?: {
                per_page?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data berhasil diambil.";
                        data: {
                            [key: string]: string;
                        };
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number | null;
                            last_page: number | null;
                        };
                        links: {
                            first: string | null;
                            last: string | null;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "integration.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    requests_per_minute?: number;
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Integrasi dibuat.";
                        data: components["schemas"]["Integration"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "integration.scopes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Success";
                        data: [
                            "pembandings:read",
                            "pembandings:similar",
                            "locations:read",
                            "dictionaries:read"
                        ];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "integration.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The integration ID */
                integration: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Success";
                        data: components["schemas"]["Integration"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "integration.update": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The integration ID */
                integration: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    name?: string;
                    is_active?: boolean;
                    requests_per_minute?: number;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Integrasi diperbarui.";
                        data: components["schemas"]["Integration"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "integration.issueKey": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The integration ID */
                integration: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    scopes: ("pembandings:read" | "pembandings:similar" | "locations:read" | "dictionaries:read")[];
                    /** Format: date-time */
                    expires_at: string;
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Simpan key ini; tidak dapat ditampilkan kembali.";
                        data: {
                            key: string;
                            plain_text_key: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "integration.revokeKey": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The integration ID */
                integration: number;
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "API key dicabut.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
}
