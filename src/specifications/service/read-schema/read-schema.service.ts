import { HttpCustomService } from './../HttpCustomService';
import { GenericFunction } from './../genericFunction';
import { Injectable } from '@nestjs/common';
import path from 'path';
import { masterSchema } from 'src/utils/spec-data';
import { error } from 'console';
const fs = require('fs')
@Injectable()
export class ReadSchemaService {
    constructor(private service: GenericFunction, private httpService: HttpCustomService) {

    }
    async insertSpecs() {
        const folderPath = './src/JsonSchemas/dimensions'   
        const files = fs.readdirSync(folderPath);
        let promises = []
        for (let i = 0; i < files?.length; i++) {
            const data = fs.readFileSync(folderPath + '/' + files[i], 'utf-8')
            try {
                const jsonData = JSON.parse(data);
                const isValidSchema: any = await this.service.ajvValidator(masterSchema, jsonData)
                if (isValidSchema.errors) {
                    console.log("error is", error)

                } else {
                    promises.push(this.httpService.post(`${process.env.SPEC_URL}/dimension`, jsonData)) 
                   
                }
            } catch (parseError) {
                console.error(`Error parsing JSON from ${files[i]}:`, parseError);
            }
        }
        try {
            await Promise.all(promises);
            return { code: 200, message: "Successfully inserted the spec" };
          } catch (error) {
            console.error("API request error:", error);
            return { code: 400, error: "Insertion Unsuccessful" };
          }    


    }
}

