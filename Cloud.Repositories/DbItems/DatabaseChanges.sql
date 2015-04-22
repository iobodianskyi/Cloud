﻿-- This file should contain code that could be executed within a
-- database transaction (guaranteeing data and schema consistency), 
-- for example create and maintain tables, table relations, CRUD 
-- of data

DECLARE @errMessage varchar(max)
DECLARE @sql varchar(max)
DECLARE @schemaVersion int, @newSchemaVersion int

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = N'dbo' AND TABLE_NAME = N'DatabaseSettings' AND TABLE_TYPE = 'BASE TABLE')
BEGIN 
	CREATE TABLE [dbo].[DatabaseSettings] (
		[ID] [int] NOT NULL,
		[SchemaVersion] [int] NOT NULL,
		CONSTRAINT [PK_DatabaseSettings] PRIMARY KEY CLUSTERED([ID])
	)
	INSERT INTO [dbo].[DatabaseSettings]([ID], [SchemaVersion]) VALUES(1, 0)
END

SELECT @schemaVersion = MAX(SchemaVersion) FROM [dbo].[DatabaseSettings]
BEGIN TRY


-- =============================================================
-- Author:		Ivan Obodianskyi
-- Update date:	2015-04-02
-- Description:	Added IsEditable, Size, LastModifiedDateTime, AddedDateTime, 
--				DownloadedTimes columns to UserFiles table
-- =============================================================
SET @newSchemaVersion = 1
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	ALTER TABLE [dbo].[UserFiles] ADD
		IsEditable bit NOT NULL CONSTRAINT DF_UserFiles_IsEditable DEFAULT(0),
		Size bigint NOT NULL CONSTRAINT DF_UserFiles_Size DEFAULT(0),
		LastModifiedDateTime datetime NOT NULL CONSTRAINT DF_UserFiles_LastModifiedDateTime DEFAULT('1/1/1999'),
		AddedDateTime datetime NOT NULL CONSTRAINT DF_UserFiles_AddedDateTime DEFAULT('1/1/1999'),
		DownloadedTimes int NOT NULL CONSTRAINT DF_UserFiles_DownloadedTimes DEFAULT(0)

	ALTER TABLE [dbo].[UserFiles] DROP
		CONSTRAINT DF_UserFiles_IsEditable,
		CONSTRAINT DF_UserFiles_Size,
		CONSTRAINT DF_UserFiles_LastModifiedDateTime,
		CONSTRAINT DF_UserFiles_AddedDateTime,
		CONSTRAINT DF_UserFiles_DownloadedTimes

	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END 


-- =============================================================
-- Author:		Ivan Obodianskyi
-- Update date:	2015-04-04
-- Description:	Added two servers to FileServers table
-- =============================================================
SET @newSchemaVersion = 2
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	INSERT INTO [dbo].[FileServers]
           ([Name], [Path])
     VALUES ('LenovoMain', 'E:\Development\MainCloudServer\'), 
			('LenovoAddth', 'E:\Development\AddthCloudSever\')

	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END 


-- =============================================================
-- Author:		Ivan Obodianskyi
-- Update date:	2015-04-18
-- Description:	Rename AspNet... table
-- =============================================================
SET @newSchemaVersion = 3
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	EXEC sp_rename 'AspNetUsers', 'Users';

	EXEC sp_rename 'AspNetRoles', 'Roles';

	EXEC sp_rename 'AspNetUserClaims', 'UserClaims';

	EXEC sp_rename 'AspNetUserLogins', 'UserLogins';

	EXEC sp_rename 'AspNetUserRoles', 'UserRoles';
	
	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END 


-- =============================================================
-- Author:		Ivan Obodianskyi
-- Update date:	2015-04-18
-- Description:	Set not null Email column in Users table
-- =============================================================
SET @newSchemaVersion = 4
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	ALTER TABLE [dbo].[Users] ALTER COLUMN [Email] nvarchar(256) NOT NULL
	
	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END 


-- =============================================================
-- Author:		Ivan Obodianskyi
-- Update date:	2015-04-22
-- Description:	Create ExternalFileServers table
-- =============================================================
SET @newSchemaVersion = 5
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	CREATE TABLE [dbo].[ExternalFileServers] 
	(
		[Id] int NOT NULL IDENTITY(1,1) PRIMARY KEY,
		[Name] nvarchar(64) NOT NULL
	)
	
	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END 


-- =============================================================
-- Author:		Ivan Obodianskyi
-- Update date:	2015-04-22
-- Description:	Added Google Drive file server to ExternalFileServers table
-- =============================================================
SET @newSchemaVersion = 6
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	INSERT INTO [dbo].[ExternalFileServers]
		(Name)
		VALUES ('Google Drive');
	
	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END 


-- =============================================================
-- Author:		Ivan Obodianskyi
-- Update date:	2015-04-22
-- Description:	Change table name FileServers to Local FileServers and UserFiles_FileServers
-- =============================================================
SET @newSchemaVersion = 7
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	EXEC sp_rename 'FileServers', 'LocalFileServers';

	EXEC sp_rename 'UserFiles_FileServers', 'UserFiles_LocalFileServers';

	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END 


/*
-- =============================================================
-- Author:		<full name>
-- Update date:	<yyyy-mm-dd>
-- Description:	<desc>
-- =============================================================
SET @newSchemaVersion = 8
IF @schemaVersion < @newSchemaVersion
BEGIN
	BEGIN TRANSACTION

	UPDATE [dbo].[DatabaseSettings] SET SchemaVersion = @newSchemaVersion
	COMMIT
END */

END TRY
BEGIN CATCH
	SELECT @errMessage = CAST(ERROR_LINE() AS VARCHAR(10)) + ' - ' + ERROR_MESSAGE()
	ROLLBACK
	RAISERROR (@errMessage, 17, 1)
END CATCH