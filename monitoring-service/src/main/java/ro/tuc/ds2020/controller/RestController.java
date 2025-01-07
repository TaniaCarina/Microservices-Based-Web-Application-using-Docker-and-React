package ro.tuc.ds2020.controller;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;
import ro.tuc.ds2020.authorization.TokenValidator;
import ro.tuc.ds2020.dto.DeviceDTO;
import ro.tuc.ds2020.dto.MeasurementDTO;
import ro.tuc.ds2020.entity.Measurement;
import ro.tuc.ds2020.service.DeviceService;
import ro.tuc.ds2020.service.MeasurementService;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@org.springframework.web.bind.annotation.RestController

@RequestMapping(value = "/measurements")

public class RestController {
    private final DeviceService deviceService;
    private final MeasurementService measurementService;
    private final TokenValidator tokenValidator = new TokenValidator();
    private final ObjectMapper objectMapper;

    public RestController(DeviceService deviceService, MeasurementService measurementService, ObjectMapper objectMapper) {
        this.deviceService = deviceService;
        this.measurementService = measurementService;
        this.objectMapper = objectMapper;
    }

    @MessageMapping("/sendMeasurement")
    @SendTo("/topic/measurements")
    public List<MeasurementDTO> handleMeasurement(@Payload String jsonMessage) {
        try {
            Map<String, Object> data = objectMapper.readValue(jsonMessage, Map.class);
            System.out.println("Received UUID: " + data.get("deviceUuid"));
            System.out.println("Received Date: " + data.get("date"));
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate localDate = LocalDate.parse((CharSequence) data.get("date"), formatter);

            List<MeasurementDTO> measurements = measurementService.getAllMeasurementsForDeviceByDay(UUID.fromString((String) data.get("deviceUuid")), LocalDate.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant()));
            System.out.println(measurements);
            return measurements;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    @GetMapping("/devices-by-id/{id}")
    ResponseEntity<List<DeviceDTO>> getAllDevicesForUser(@PathVariable UUID uuid){
        List<DeviceDTO> devices = deviceService.getAllDevicesForUser(uuid);
        return ResponseEntity.ok(devices);
    }
//
//    @GetMapping("/measurements-by-day/{id}/{date}")
//    ResponseEntity<List<MeasurementDTO>> getAllMeasurementsForDeviceByDate(@PathVariable("id") UUID uuid, @PathVariable("date") LocalDate date,
//                                                                           @RequestHeader("Authorization") String token){
//        if(tokenValidator.validate(token) == false){
//            List<MeasurementDTO> measurements = measurementService.getAllMeasurementsForDeviceByDay(uuid, date);
//            System.out.println(uuid);
//            System.out.println(date);
//            System.out.println(measurements);
//            return ResponseEntity.ok(measurements);
//
//        }
//        return ResponseEntity.badRequest().build();
//    }

//    @GetMapping("/measurements-by-day/{id}/{date}")
//    ResponseEntity<List<MeasurementDTO>> getAllMeasurementsForDeviceByDate(@PathVariable("id") UUID uuid, @PathVariable("date") LocalDate date){
//        List<MeasurementDTO> measurements = measurementService.getAllMeasurementsForDeviceByDay(uuid, date);
//        System.out.println(uuid);
//        System.out.println(date);
//        return ResponseEntity.ok(measurements);
//    }


}
