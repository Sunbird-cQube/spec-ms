import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { GenericFunction } from '../genericFunction';
import { DimensionService } from './dimension.service';



describe('DimensionService', () => {
    let service: DimensionService;
    const mockTransacation = {
        createQueryRunner: jest.fn().mockImplementation(() => ({
            connect: jest.fn(),
            startTransaction: jest.fn(),
            release: jest.fn(),
            rollbackTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            query: jest.fn().mockReturnValueOnce([{ pid: 1 }])
        })),
        query: jest.fn().mockReturnValueOnce([{ length: 1 }])
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DimensionService, DataSource, GenericFunction,
                {
                    provide: DimensionService,
                    useClass: DimensionService
                },
                {
                    provide: DataSource,
                    useValue: mockTransacation
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }
            ]
        }).compile();

        service = module.get<DimensionService>(DimensionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('validation', async () => {
        let dimensionData = {
            "name": "dimension",
            "input": {
                "type": "object",
                "properties": {
                    "school_id": {
                        "type": "string"
                    },
                    "school_name": {
                        "type": "string"
                    },
                    "cluster_id": {
                        "type": "string"
                    },
                    "cluster_name": {
                        "type": "string"
                    },
                    "block_id": {
                        "type": "string"
                    },
                    "block_name": {
                        "type": "string"
                    },
                    "district_id": {
                        "type": "string"
                    },
                    "district_name": {
                        "type": "string"
                    },
                    "state_id": {
                        "type": "string"
                    },
                    "state_name": {
                        "type": "string"
                    }
                },
                "required": [
                    "school_id",
                    "school_name",
                    "cluster_id",
                    "cluster_name",
                    "block_id",
                    "block_name",
                    "district_id",
                    "district_name",
                    "state_id",
                    "state_name"
                ]




            }
        }
        let resultData = {
            "code": 400, "error": [
                {
                    "instancePath": "",
                    "schemaPath": "#/required",
                    "keyword": "required",
                    "params": {
                        "missingProperty": "program"
                    },
                    "message": "must have required property 'program'"
                }
            ]
        }
        expect(await service.createDimension(dimensionData)).toStrictEqual(resultData)
    });

    it('Dimension Name already exists', async () => {
        let dimensionData = {
            "program": "school",
            "input": {
                "type": "object",
                "properties": {
                    "school_id": {
                        "type": "string"
                    },
                    "school_name": {
                        "type": "string"
                    },
                    "cluster_id": {
                        "type": "string"
                    },
                    "cluster_name": {
                        "type": "string"
                    },
                    "block_id": {
                        "type": "string"
                    },
                    "block_name": {
                        "type": "string"
                    },
                    "district_id": {
                        "type": "string"
                    },
                    "district_name": {
                        "type": "string"
                    },
                    "state_id": {
                        "type": "string"
                    },
                    "state_name": {
                        "type": "string"
                    }
                },
                "required": [
                    "school_id",
                    "school_name",
                    "cluster_id",
                    "cluster_name",
                    "block_id",
                    "block_name",
                    "district_id",
                    "district_name",
                    "state_id",
                    "state_name"
                ]




            }
        }
        let result = {
            "code": 400, "error": "Dimension spec already exists"
        };
        expect(await service.createDimension(dimensionData)).toStrictEqual(result)
    });
    //

    it('dimension created successfully', async () => {
        const mockTransacation = {
            createQueryRunner: jest.fn().mockImplementation(() => ({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                release: jest.fn(),
                rollbackTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                query: jest.fn().mockReturnValueOnce([{ id: 1 }])
            })),
            query: jest.fn().mockReturnValueOnce([])
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [DimensionService, DataSource, GenericFunction,
                {
                    provide: DimensionService,
                    useClass: DimensionService
                },
                {
                    provide: DataSource,
                    useValue: mockTransacation
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                }
            ]
        }).compile();

        service = module.get<DimensionService>(DimensionService);
        
        let dimensionData = {
            "program": "school",
            "input": {
                "type": "object",
                "properties": {
                    "school_id": {
                        "type": "string"
                    },
                    "school_name": {
                        "type": "string"
                    },
                    "cluster_id": {
                        "type": "string"
                    },
                    "cluster_name": {
                        "type": "string"
                    },
                    "block_id": {
                        "type": "string"
                    },
                    "block_name": {
                        "type": "string"
                    },
                    "district_id": {
                        "type": "string"
                    },
                    "district_name": {
                        "type": "string"
                    },
                    "state_id": {
                        "type": "string"
                    },
                    "state_name": {
                        "type": "string"
                    }
                },
                "required": [
                    "school_id",
                    "school_name",
                    "cluster_id",
                    "cluster_name",
                    "block_id",
                    "block_name",
                    "district_id",
                    "district_name",
                    "state_id",
                    "state_name"
                ]




            }
        }
        let result = {
            "code": 200,
            "message": "Dimension spec created successfully",
            "program": dimensionData.program,
        };
        expect(await service.createDimension(dimensionData)).toStrictEqual(result)
    });
    
    it('Unable to insert into spec table', async () => {
    
        const mockTransaction = {
            createQueryRunner: jest.fn().mockImplementation(() => ({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                release: jest.fn(),
                rollbackTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                query: jest.fn().mockReturnValueOnce([{}])
            })),
            query: jest.fn().mockReturnValueOnce([])
        };
        let dimensionData = {
            "program": "school",
            "input": {
                "type": "object",
                "properties": {
                    "school_id": {
                        "type": "string"
                    },
                    "school_name": {
                        "type": "string"
                    },
                    "cluster_id": {
                        "type": "string"
                    },
                    "cluster_name": {
                        "type": "string"
                    },
                    "block_id": {
                        "type": "string"
                    },
                    "block_name": {
                        "type": "string"
                    },
                    "district_id": {
                        "type": "string"
                    },
                    "district_name": {
                        "type": "string"
                    },
                    "state_id": {
                        "type": "string"
                    },
                    "state_name": {
                        "type": "string"
                    }
                },
                "required": [
                    "school_id",
                    "school_name",
                    "cluster_id",
                    "cluster_name",
                    "block_id",
                    "block_name",
                    "district_id",
                    "district_name",
                    "state_id",
                    "state_name"
                ]




            }
        }
        const module: TestingModule = await Test.createTestingModule({
            providers: [DimensionService, DataSource, GenericFunction,
                {
                    provide: DimensionService,
                    useClass: DimensionService
                },
                {
                    provide: DataSource,
                    useValue: mockTransaction
                },
                {
                    provide: GenericFunction,
                    useClass: GenericFunction
                },
            ],
    
        }).compile();
    
        let localService: DimensionService = module.get<DimensionService>(DimensionService);
        let result = {"code": 400, "error": "Unable to insert into spec table"};
        expect(await localService.createDimension(dimensionData)).toStrictEqual(result)
    });
    

});
