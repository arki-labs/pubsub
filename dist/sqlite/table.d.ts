/**
 * The messages table: `id` (auto-increment, the subscribers' cursor), `channel`,
 * `payload` and `createdAt` (the database clock, used for retention). Export it
 * from your schema so your migrations create it.
 *
 * @example
 * ```ts skip="needs a database"
 * export const pubsubMessages = pubsubTable();
 * ```
 */
export declare function pubsubTable(name?: string): import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: string;
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: string;
            tableName: string;
            dataType: "number int53";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}>;
        channel: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: string;
            tableName: string;
            dataType: "string";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}>;
        payload: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: string;
            tableName: string;
            dataType: "string";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}>;
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: string;
            tableName: string;
            dataType: "object date";
            data: Date;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}>;
    };
    dialect: 'sqlite';
}>;
/** The table {@link pubsubTable} builds. */
export type PubsubTable = ReturnType<typeof pubsubTable>;
//# sourceMappingURL=table.d.ts.map